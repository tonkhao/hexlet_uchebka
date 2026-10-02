import pool from '../config/db.js';

// Специальное значение, которым метод сигнализирует о невозможности расчета.
// Вместо исключения вызывающий код получает предсказуемый результат.
export const CALCULATION_ERROR = -1;

export const ERROR_MESSAGES = {
    NO_INPUT: 'Набор входных параметров не передан',
    INVALID_PRODUCT_TYPE_ID: 'product_type_id должен быть целым положительным числом',
    INVALID_MATERIAL_TYPE_ID: 'material_type_id должен быть целым положительным числом',
    INVALID_QUANTITY: 'quantity должен быть целым числом больше нуля',
    INVALID_PARAM_1: 'param_1 должен быть неотрицательным числом',
    INVALID_PARAM_2: 'param_2 должен быть неотрицательным числом',
    PRODUCT_TYPE_NOT_FOUND: 'Тип продукции не найден в справочнике product_types',
    MATERIAL_TYPE_NOT_FOUND: 'Тип материала не найден в справочнике material_types',
    REFERENCES_UNAVAILABLE: 'Не удалось получить справочные данные из СУБД',
    CALCULATION_OVERFLOW: 'Результат расчета вышел за пределы числового диапазона',
};

// Оба справочных значения запрашиваются одним запросом через LEFT JOIN:
// строка возвращается всегда, поэтому отсутствие любого из справочников
// определяется по null в соответствующей колонке.
const REFERENCE_QUERY = `
    SELECT
        pt.coefficient,
        mt.defect_percent
    FROM (SELECT 1) AS anchor
    LEFT JOIN public.product_types pt ON pt.product_type_id = $1
    LEFT JOIN public.material_types mt ON mt.material_type_id = $2;
`;

const PRODUCT_COEFFICIENT_QUERY = `
    SELECT coefficient FROM public.product_types WHERE product_type_id = $1;
`;

const MATERIAL_DEFECT_QUERY = `
    SELECT defect_percent FROM public.material_types WHERE material_type_id = $1;
`;

const PRODUCT_TYPES_QUERY = `
    SELECT product_type_id, type_name, coefficient
    FROM public.product_types
    ORDER BY type_name;
`;

const MATERIAL_TYPES_QUERY = `
    SELECT material_type_id, type_name, defect_percent
    FROM public.material_types
    ORDER BY type_name;
`;

/**
 * Реализация доступа к справочникам БД.
 * Вынесена отдельно, чтобы в тестах можно было подставить мок-объект
 * без подключения к СУБД.
 */
export const materialReferenceRepository = {
    async getReferences(productTypeId, materialTypeId) {
        const result = await pool.query(REFERENCE_QUERY, [productTypeId, materialTypeId]);
        const row = result.rows[0] ?? {};
        return {
            coefficient: row.coefficient ?? null,
            defectPercent: row.defect_percent ?? null,
        };
    },

    async getProductTypeCoefficient(productTypeId) {
        const result = await pool.query(PRODUCT_COEFFICIENT_QUERY, [productTypeId]);
        return result.rows[0]?.coefficient ?? null;
    },

    async getMaterialDefectPercent(materialTypeId) {
        const result = await pool.query(MATERIAL_DEFECT_QUERY, [materialTypeId]);
        return result.rows[0]?.defect_percent ?? null;
    },

    // Списки справочников нужны форме калькулятора, чтобы менеджер
    // выбирал тип из выпадающего списка, а не вводил идентификатор вручную
    async getProductTypes() {
        const result = await pool.query(PRODUCT_TYPES_QUERY);
        return result.rows.map(row => ({
            product_type_id: row.product_type_id,
            type_name: row.type_name,
            coefficient: Number(row.coefficient),
        }));
    },

    async getMaterialTypes() {
        const result = await pool.query(MATERIAL_TYPES_QUERY);
        return result.rows.map(row => ({
            material_type_id: row.material_type_id,
            type_name: row.type_name,
            defect_percent: Number(row.defect_percent),
        }));
    },
};

// Справочники по умолчанию — реальные запросы в СУБД
const DEFAULT_LOOKUP = materialReferenceRepository;

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function isValidId(value) {
    return Number.isInteger(value) && value > 0;
}

/**
 * Валидация входных параметров.
 * Возвращает текст ошибки или null, если параметры корректны.
 * Ошибка возвращается значением, а не бросается исключением:
 * контракт метода — вернуть -1 вместо падения программы.
 */
export function validateCalculationInput(input) {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
        return ERROR_MESSAGES.NO_INPUT;
    }

    const {
        product_type_id, material_type_id, quantity, param_1, param_2,
    } = input;

    if (!isValidId(product_type_id)) {
        return ERROR_MESSAGES.INVALID_PRODUCT_TYPE_ID;
    }

    if (!isValidId(material_type_id)) {
        return ERROR_MESSAGES.INVALID_MATERIAL_TYPE_ID;
    }

    // Количество продукции объявлено целым числом и должно быть строго больше нуля
    if (!Number.isInteger(quantity) || quantity <= 0) {
        return ERROR_MESSAGES.INVALID_QUANTITY;
    }

    // param_1 и param_2 — вещественные параметры изделия. Отрицательные
    // и нечисловые значения недопустимы. Ноль допустим: он дает нулевой
    // расход, то есть материал для такого изделия не требуется.
    if (!isFiniteNumber(param_1) || param_1 < 0) {
        return ERROR_MESSAGES.INVALID_PARAM_1;
    }

    if (!isFiniteNumber(param_2) || param_2 < 0) {
        return ERROR_MESSAGES.INVALID_PARAM_2;
    }

    return null;
}

/**
 * Получение справочных значений и проверка их наличия.
 * @returns {{coefficient: number|null, defectPercent: number|null, error: string|null}}
 */
async function resolveReferences(lookup, productTypeId, materialTypeId) {
    let raw;

    try {
        raw = await lookup.getReferences(productTypeId, materialTypeId);
    } catch {
        return {
            coefficient: null,
            defectPercent: null,
            error: ERROR_MESSAGES.REFERENCES_UNAVAILABLE,
        };
    }

    const rawCoefficient = raw?.coefficient;
    const rawDefectPercent = raw?.defectPercent;

    // Несуществующий тип продукции
    if (rawCoefficient === null || rawCoefficient === undefined) {
        return {
            coefficient: null,
            defectPercent: null,
            error: ERROR_MESSAGES.PRODUCT_TYPE_NOT_FOUND,
        };
    }

    // Несуществующий тип материала
    if (rawDefectPercent === null || rawDefectPercent === undefined) {
        return {
            coefficient: null,
            defectPercent: null,
            error: ERROR_MESSAGES.MATERIAL_TYPE_NOT_FOUND,
        };
    }

    // pg возвращает numeric как строку, поэтому приводим к number явно
    const coefficient = Number(rawCoefficient);
    const defectPercent = Number(rawDefectPercent);

    // Битые значения справочника (NaN, отрицательный коэффициент) считаем ошибкой
    if (!Number.isFinite(coefficient) || coefficient <= 0) {
        return {
            coefficient: null,
            defectPercent: null,
            error: ERROR_MESSAGES.PRODUCT_TYPE_NOT_FOUND,
        };
    }

    if (!Number.isFinite(defectPercent) || defectPercent < 0) {
        return {
            coefficient: null,
            defectPercent: null,
            error: ERROR_MESSAGES.MATERIAL_TYPE_NOT_FOUND,
        };
    }

    return {
        coefficient,
        defectPercent,
        error: null,
    };
}

/**
 * Арифметическое ядро метода.
 *
 * Цепочка расчета:
 *   1) Базовый расход на 1 ед.        = param_1 * param_2 * коэффициент типа продукции
 *   2) Общий чистый расход             = базовый расход на 1 ед. * quantity
 *   3) Итоговый расход с учетом брака  = общий чистый расход * (1 + процент брака / 100)
 *   4) Результат округляется вверх     = Math.ceil(итоговый расход)
 *
 * @param {object} input параметры расчета
 * @param {number} input.product_type_id   идентификатор типа продукции
 * @param {number} input.material_type_id  идентификатор типа материала
 * @param {number} input.quantity          количество производимой продукции, шт.
 * @param {number} input.param_1           первый вещественный параметр изделия
 * @param {number} input.param_2           второй вещественный параметр изделия
 * @param {object} [lookup] источник справочных данных; по умолчанию — СУБД.
 *                        В тестах передаются мок-объекты.
 * @returns {Promise<number>} расход материала в целых единицах либо -1,
 *                            если расчет невозможен
 */
export async function calculateMaterialRequirement(input, lookup = DEFAULT_LOOKUP) {
    const detailed = await calculateMaterialRequirementDetailed(input, lookup);

    return detailed.result;
}

/**
 * Расширенная версия метода: возвращает структуру с итогом,
 * промежуточными значениями цепочки расчета и причиной отказа.
 * Ядро не дублируется — оба метода используют один расчет.
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   result: number,
 *   product_type_id: number|null,
 *   material_type_id: number|null,
 *   quantity: number|null,
 *   param_1: number|null,
 *   param_2: number|null,
 *   basePerUnit: number|null,
 *   netTotal: number|null,
 *   withDefect: number|null,
 *   defectPercent: number|null,
 *   error: string|null
 * }>}
 */
export async function calculateMaterialRequirementDetailed(input, lookup = DEFAULT_LOOKUP) {
    const { product_type_id, material_type_id, quantity, param_1, param_2 } = input ?? {};

    const echo = {
        product_type_id: product_type_id ?? null,
        material_type_id: material_type_id ?? null,
        quantity: quantity ?? null,
        param_1: isFiniteNumber(param_1) ? param_1 : null,
        param_2: isFiniteNumber(param_2) ? param_2 : null,
    };

    function failure(error) {
        return {
            ok: false,
            result: CALCULATION_ERROR,
            ...echo,
            basePerUnit: null,
            netTotal: null,
            withDefect: null,
            defectPercent: null,
            error,
        };
    }

    const validationError = validateCalculationInput(input);

    if (validationError !== null) {
        return failure(validationError);
    }

    const references = await resolveReferences(lookup, product_type_id, material_type_id);

    if (references.error !== null) {
        return failure(references.error);
    }

    const { coefficient, defectPercent } = references;

    // 1) Базовый расход на 1 единицу продукции
    const basePerUnit = param_1 * param_2 * coefficient;

    // 2) Общий чистый расход на всю партию
    const netTotal = basePerUnit * quantity;

    // 3) Итоговый расход с учетом процента брака материала
    const withDefect = netTotal * (1 + defectPercent / 100);

    if (!Number.isFinite(withDefect)) {
        return failure(ERROR_MESSAGES.CALCULATION_OVERFLOW);
    }

    // 4) Округление в большую сторону: недобор сырья недопустим
    return {
        ok: true,
        result: Math.ceil(withDefect),
        ...echo,
        basePerUnit,
        netTotal,
        withDefect,
        defectPercent,
        error: null,
    };
}
