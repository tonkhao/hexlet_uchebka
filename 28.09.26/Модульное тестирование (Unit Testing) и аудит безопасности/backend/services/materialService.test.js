import {
    CALCULATION_ERROR,
    calculateMaterialRequirement,
    calculateMaterialRequirementDetailed,
    validateCalculationInput,
} from './materialService.js';

// Мок справочников: unit-тесты не должны обращаться к СУБД.
// Значения заданы строками, как их возвращает pg для типа numeric.
const PRODUCT_TYPES = {
    1: '1.0',
    2: '1.2',
    3: '1.5',
    4: '0.8',
};

const MATERIAL_TYPES = {
    1: '0',
    2: '5',
    3: '10',
};

function mockLookup(productTypes = PRODUCT_TYPES, materialTypes = MATERIAL_TYPES) {
    return {
        getReferences: async (productTypeId, materialTypeId) => ({
            coefficient: productTypes[productTypeId] ?? null,
            defectPercent: materialTypes[materialTypeId] ?? null,
        }),
    };
}

// Эталонная формула из ТЗ, вычисленная независимо от реализации
function expectedResult(param1, param2, quantity, coefficient, defectPercent) {
    const perUnit = param1 * param2 * coefficient;
    const netTotal = perUnit * quantity;
    const withDefect = netTotal * (1 + defectPercent / 100);
    return Math.ceil(withDefect);
}

describe('Тест 1 (Стандартный): обычный расчет с известным результатом', () => {
    test('2 * 3 * коэффициент 1.0 * 10 шт без брака = 60', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 1,
            quantity: 10,
            param_1: 2,
            param_2: 3,
        }, mockLookup());

        expect(result).toBe(60);
    });

    test('2.5 * 4 * коэффициент 1.2 * 10 шт с браком 5% = 126', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 2,
            material_type_id: 2,
            quantity: 10,
            param_1: 2.5,
            param_2: 4,
        }, mockLookup());

        expect(result).toBe(126);
    });

    test('Результат совпадает с эталонной формулой на наборе корректных данных', async () => {
        const cases = [
            { product_type_id: 1, material_type_id: 1, quantity: 13, param_1: 0.75, param_2: 3.5 },
            { product_type_id: 2, material_type_id: 3, quantity: 250, param_1: 1.25, param_2: 0.4 },
            { product_type_id: 3, material_type_id: 2, quantity: 7, param_1: 12, param_2: 12 },
        ];

        for (const testCase of cases) {
            const result = await calculateMaterialRequirement(testCase, mockLookup());

            expect(result).toBe(expectedResult(
                testCase.param_1,
                testCase.param_2,
                testCase.quantity,
                Number(PRODUCT_TYPES[testCase.product_type_id]),
                Number(MATERIAL_TYPES[testCase.material_type_id]),
            ));
        }
    });
});

describe('Тест 2 (Округление): результат округляется строго вверх', () => {
    test('Дробный результат 1.21 округляется до 2, а не до 1', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 1,
            quantity: 1,
            param_1: 1.1,
            param_2: 1.1,
        }, mockLookup());

        expect(result).toBe(2);
    });

    test('Результат 6.6 округляется до 7', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 3,
            quantity: 1,
            param_1: 2,
            param_2: 3,
        }, mockLookup());

        expect(result).toBe(7);
    });

    test('Результат 12.9 округляется до 13', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 4,
            material_type_id: 2,
            quantity: 5,
            param_1: 1.5,
            param_2: 2,
        }, mockLookup());

        expect(result).toBe(13);
    });

    test('Целое значение не изменяется', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 1,
            quantity: 1,
            param_1: 2,
            param_2: 3,
        }, mockLookup());

        expect(result).toBe(6);
    });

    test('Для всех тестов округление соответствует Math.ceil, а не Math.round/floor', async () => {
        const cases = [
            { product_type_id: 1, material_type_id: 3, quantity: 7, param_1: 0.3, param_2: 0.7 },
            { product_type_id: 2, material_type_id: 2, quantity: 3, param_1: 1.1, param_2: 1.1 },
            { product_type_id: 4, material_type_id: 1, quantity: 11, param_1: 0.05, param_2: 0.02 },
        ];

        for (const testCase of cases) {
            const result = await calculateMaterialRequirement(testCase, mockLookup());
            const raw = testCase.param_1
                * testCase.param_2
                * Number(PRODUCT_TYPES[testCase.product_type_id])
                * testCase.quantity
                * (1 + Number(MATERIAL_TYPES[testCase.material_type_id]) / 100);

            expect(result).toBe(Math.ceil(raw));
            expect(Number.isInteger(result)).toBe(true);
        }
    });
});

describe('Тест 3 (Несуществующий тип): некорректные ID дают -1', () => {
    test('Несуществующий product_type_id возвращает -1', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 999,
            material_type_id: 1,
            quantity: 10,
            param_1: 2,
            param_2: 2,
        }, mockLookup());

        expect(result).toBe(CALCULATION_ERROR);
        expect(result).toBe(-1);
    });

    test('Несуществующий material_type_id возвращает -1', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 888,
            quantity: 10,
            param_1: 2,
            param_2: 2,
        }, mockLookup());

        expect(result).toBe(-1);
    });

    test('Оба идентификатора несуществующие возвращают -1', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 404,
            material_type_id: 405,
            quantity: 1,
            param_1: 1,
            param_2: 1,
        }, mockLookup());

        expect(result).toBe(-1);
    });

    test('Нулевые, отрицательные и дробные идентификаторы возвращают -1', async () => {
        const invalidIds = [0, -1, -100, 1.5, 'abc', null, undefined];

        for (const invalidId of invalidIds) {
            const byProductType = await calculateMaterialRequirement({
                product_type_id: invalidId,
                material_type_id: 1,
                quantity: 5,
                param_1: 1,
                param_2: 1,
            }, mockLookup());

            const byMaterialType = await calculateMaterialRequirement({
                product_type_id: 1,
                material_type_id: invalidId,
                quantity: 5,
                param_1: 1,
                param_2: 1,
            }, mockLookup());

            expect(byProductType).toBe(-1);
            expect(byMaterialType).toBe(-1);
        }
    });
});

describe('Тест 4 (Отрицательные параметры): param_1 или param_2 < 0 дают -1', () => {
    test('Отрицательный param_1 возвращает -1', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 1,
            quantity: 10,
            param_1: -2.5,
            param_2: 4,
        }, mockLookup());

        expect(result).toBe(-1);
    });

    test('Отрицательный param_2 возвращает -1', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 1,
            quantity: 10,
            param_1: 2.5,
            param_2: -4,
        }, mockLookup());

        expect(result).toBe(-1);
    });

    test('Оба параметра отрицательные возвращают -1', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 1,
            quantity: 10,
            param_1: -1,
            param_2: -1,
        }, mockLookup());

        expect(result).toBe(-1);
    });

    test('Любая отрицательная величина параметров возвращает -1', async () => {
        const negativeValues = [-0.01, -1, -1000];

        for (const negative of negativeValues) {
            for (const field of ['param_1', 'param_2']) {
                const result = await calculateMaterialRequirement({
                    product_type_id: 1,
                    material_type_id: 1,
                    quantity: 10,
                    param_1: 2,
                    param_2: 2,
                    [field]: negative,
                }, mockLookup());

                expect(result).toBe(-1);
            }
        }
    });

    test('Нечисловые параметры (NaN, Infinity, строки, null) возвращают -1', async () => {
        const invalidValues = [Number.NaN, Infinity, -Infinity, 'abc', null, undefined];

        for (const invalid of invalidValues) {
            for (const field of ['param_1', 'param_2']) {
                const result = await calculateMaterialRequirement({
                    product_type_id: 1,
                    material_type_id: 1,
                    quantity: 10,
                    param_1: 2,
                    param_2: 2,
                    [field]: invalid,
                }, mockLookup());

                expect(result).toBe(-1);
            }
        }
    });
});

describe('Тест 5 (Нулевое количество): quantity <= 0 дает -1', () => {
    test('Количество, равное нулю, возвращает -1', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 1,
            quantity: 0,
            param_1: 2.5,
            param_2: 4,
        }, mockLookup());

        expect(result).toBe(-1);
    });

    test('Отрицательное количество возвращает -1', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 1,
            quantity: -50,
            param_1: 2.5,
            param_2: 4,
        }, mockLookup());

        expect(result).toBe(-1);
    });

    test('Дробное количество возвращает -1 (quantity объявлен как int)', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 1,
            quantity: 10.5,
            param_1: 2.5,
            param_2: 4,
        }, mockLookup());

        expect(result).toBe(-1);
    });

    test('Пустое и нечисловое количество возвращает -1', async () => {
        for (const invalid of [null, undefined, 'abc', Number.NaN, Infinity]) {
            const result = await calculateMaterialRequirement({
                product_type_id: 1,
                material_type_id: 1,
                quantity: invalid,
                param_1: 2,
                param_2: 2,
            }, mockLookup());

            expect(result).toBe(-1);
        }
    });

    test('Минимально допустимое количество равное 1 рассчитывается', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 1,
            quantity: 1,
            param_1: 2,
            param_2: 3,
        }, mockLookup());

        expect(result).toBe(6);
    });
});

describe('Устойчивость метода: ни один вход не приводит к исключению', () => {
    test('Некорректный набор параметров возвращает -1, а не бросает ошибку', async () => {
        const badInputs = [
            null,
            undefined,
            {},
            [],
            'произвольная строка',
            42,
            { product_type_id: 1 },
            { product_type_id: 999, material_type_id: 999, quantity: 5, param_1: 1, param_2: 1 },
            { product_type_id: 1, material_type_id: 1, quantity: -1, param_1: 1, param_2: 1 },
        ];

        for (const badInput of badInputs) {
            await expect(calculateMaterialRequirement(badInput, mockLookup()))
                .resolves
                .toBe(-1);
        }
    });

    test('Недоступность справочников возвращает -1', async () => {
        const brokenLookup = {
            getReferences: async () => {
                throw new Error('соединение с БД потеряно');
            },
        };

        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 1,
            quantity: 10,
            param_1: 2,
            param_2: 2,
        }, brokenLookup);

        expect(result).toBe(-1);
    });

    test('Переполнение числового диапазона возвращает -1', async () => {
        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 1,
            quantity: Number.MAX_SAFE_INTEGER,
            param_1: 1e308,
            param_2: 1e308,
        }, mockLookup());

        expect(result).toBe(-1);
    });

    test('Битые справочные значения возвращают -1', async () => {
        const lookup = mockLookup({ 1: 'не число' }, { 1: '5' });

        const result = await calculateMaterialRequirement({
            product_type_id: 1,
            material_type_id: 1,
            quantity: 10,
            param_1: 2,
            param_2: 2,
        }, lookup);

        expect(result).toBe(-1);
    });
});

describe('Валидация входных параметров', () => {
    test('Корректный набор не выявляет ошибок', () => {
        expect(validateCalculationInput({
            product_type_id: 1,
            material_type_id: 1,
            quantity: 10,
            param_1: 2.5,
            param_2: 4,
        })).toBeNull();
    });

    test('Некорректный набор возвращает текст ошибки', () => {
        expect(validateCalculationInput(null)).toBe('Набор входных параметров не передан');
        expect(typeof validateCalculationInput({ product_type_id: 0 })).toBe('string');
    });
});

describe('Расширенный отчет о расчете', () => {
    test('Отчет содержит промежуточные значения цепочки расчета', async () => {
        const report = await calculateMaterialRequirementDetailed({
            product_type_id: 2,
            material_type_id: 2,
            quantity: 10,
            param_1: 2.5,
            param_2: 4,
        }, mockLookup());

        expect(report.ok).toBe(true);
        expect(report.error).toBeNull();
        expect(report.basePerUnit).toBeCloseTo(12, 10);
        expect(report.netTotal).toBeCloseTo(120, 10);
        expect(report.withDefect).toBeCloseTo(126, 10);
        expect(report.result).toBe(126);
        expect(report.defectPercent).toBe(5);
    });

    test('При отказе отчет содержит -1 и понятную причину', async () => {
        const report = await calculateMaterialRequirementDetailed({
            product_type_id: 999,
            material_type_id: 1,
            quantity: 10,
            param_1: 2.5,
            param_2: 4,
        }, mockLookup());

        expect(report.ok).toBe(false);
        expect(report.result).toBe(-1);
        expect(report.error).toBe('Тип продукции не найден в справочнике product_types');
    });

    test('Отчет и основной метод дают одинаковый итог', async () => {
        const input = {
            product_type_id: 3,
            material_type_id: 3,
            quantity: 137,
            param_1: 1.7,
            param_2: 2.3,
        };
        const lookup = mockLookup();

        const report = await calculateMaterialRequirementDetailed(input, lookup);
        const result = await calculateMaterialRequirement(input, lookup);

        expect(report.result).toBe(result);
    });
});