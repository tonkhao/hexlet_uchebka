import { jest } from '@jest/globals';

// Модуль БД заменяется заглушкой до импорта сервисов:
// так видно, с каким SQL и параметрами сервис обращается к СУБД
const queryCalls = [];

// Заглушка отвечает так, чтобы код доходил до нужного участка:
// поиск типа партнера должен находить значение, иначе addPartner
// корректно прервется с 400 раньше, чем дойдет до INSERT
function fakeRowsFor(sql) {
    if (sql.includes('FROM partner_types WHERE partner_type_name')) {
        return [{ partner_type_id: 1 }];
    }
    if (sql.includes('INSERT INTO partners')) {
        return [{ partner_id: 1 }];
    }
    if (sql.includes('UPDATE partners SET')) {
        return [{ partner_id: 1 }];
    }
    return [];
}

const fakePool = {
    query: async (sql, params) => {
        queryCalls.push({ sql, params });
        return { rows: fakeRowsFor(sql) };
    },
};

jest.unstable_mockModule('../config/db.js', () => ({
    default: fakePool,
}));

const {
    addPartner,
    getPartnerSalesHistory,
    getPartnerWithDiscount,
    getPartnersWithDiscount,
    updatePartner,
} = await import('./parnerService.js');

const {
    getPartnerSalesHistory: getHistory,
    materialReferenceRepository,
} = await import('./materialService.js');

// Классические payloads для проверки экранирования
const INJECTION_PAYLOADS = [
    "'; DROP TABLE partners; --",
    "' OR '1'='1",
    '1; DELETE FROM sales WHERE 1=1',
    "Robert'); DROP TABLE students;--",
    '\\" OR 1=1 --',
    "'; UPDATE partners SET company_name='hacked",
    "admin'--",
    "' UNION SELECT NULL, NULL --",
];

function sqlUsedInCalls() {
    return queryCalls.map(call => call.sql);
}

beforeEach(() => {
    queryCalls.length = 0;
});

describe('Аудит безопасности: SQL-запросы параметризованы', () => {
    test('Payload из названия компании не попадает в текст SQL', async () => {
        const payload = "'; DROP TABLE partners; --";

        await expect(addPartner({
            company_name: payload,
            partner_type: 'ООО',
            rating: 5,
            legal_address: 'г. Москва',
            director_name: 'Иванов',
            contact_email: 'test@example.ru',
            phone: '+7 999 123-45-67',
        })).resolves.not.toThrow();

        for (const call of queryCalls) {
            expect(call.sql).not.toContain(payload);
            expect(call.sql).not.toContain('DROP TABLE');
        }

        // Payload передан именно как параметр, а не как часть запроса
        const insertCall = queryCalls.find(call => Array.isArray(call.params)
            && call.params.includes(payload));

        expect(insertCall).toBeDefined();
        expect(insertCall.sql).toContain('$1');
    });

    test('Payload из идентификатора партнера не попадает в текст SQL', async () => {
        for (const payload of INJECTION_PAYLOADS) {
            queryCalls.length = 0;

            await getPartnerWithDiscount(payload);
            await getPartnerSalesHistory(payload);

            for (const call of queryCalls) {
                expect(call.sql).not.toContain(payload);
                expect(call.sql).not.toContain('DROP');
                expect(call.sql).not.toContain('DELETE');
            }
        }
    });

    test('Payload из идентификатора типа не попадает в текст SQL', async () => {
        for (const payload of INJECTION_PAYLOADS) {
            queryCalls.length = 0;

            await addPartner({
                company_name: 'ООО Ромашка',
                partner_type: payload,
                rating: 5,
            });

            for (const call of queryCalls) {
                expect(call.sql).not.toContain(payload);
            }
        }
    });

    test('Payload из телефона и email не попадает в текст SQL', async () => {
        const payload = "' OR '1'='1";

        await updatePartner(1, {
            company_name: 'ООО Ромашка',
            partner_type: 'ООО',
            rating: 5,
            legal_address: 'г. Москва',
            director_name: 'Иванов',
            contact_email: payload,
            phone: payload,
        });

        for (const call of queryCalls) {
            expect(call.sql).not.toContain(payload);
        }
    });

    test('Справочники материалов не принимают текст в идентификаторах', async () => {
        for (const payload of INJECTION_PAYLOADS) {
            queryCalls.length = 0;

            await materialReferenceRepository.getReferences(payload, payload);

            for (const call of queryCalls) {
                expect(call.sql).not.toContain(payload);
                expect(call.sql).toContain('$1');
                expect(call.sql).toContain('$2');
            }
        }
    });

    test('Все запросы, принимающие данные, используют плейсхолдеры $n', async () => {
        await getPartnersWithDiscount();

        for (const call of queryCalls) {
            const hasParameters = Array.isArray(call.params) && call.params.length > 0;
            if (hasParameters) {
                expect(call.sql).toMatch(/\$1/);
            }
        }
    });

    test('Списочные запросы справочников не содержат внешних данных', async () => {
        await materialReferenceRepository.getProductTypes();
        await materialReferenceRepository.getMaterialTypes();

        for (const call of queryCalls) {
            expect(call.params).toBeUndefined();
            expect(call.sql).toMatch(/FROM public\.(product_types|material_types)/);
        }
    });
});

describe('Аудит безопасности: единственная интерполяция собирает только константы проекта', () => {
    test('В parnerService.js подставляются лишь PARTNER_SELECT и PARTNER_GROUP_ORDER', async () => {
        const fs = await import('fs');

        const source = fs.readFileSync(
            new URL('./parnerService.js', import.meta.url),
            'utf8',
        );

        // Проверяются только строки, собирающие текст SQL.
        // Подстановки в тексте сообщений об ошибках безопасны по определению:
        // они не попадают в базу данных.
        const sqlLines = source
            .split('\n')
            .filter(line => /pool\.query|const query/.test(line))
            .map(line => line.trim());

        expect(sqlLines.length).toBeGreaterThan(0);

        const allowedFragments = ['PARTNER_SELECT', 'PARTNER_GROUP_ORDER'];

        for (const line of sqlLines) {
            const substitutions = line.match(/\$\{([^}]+)\}/g) ?? [];

            for (const substitution of substitutions) {
                const name = substitution.replace(/[${}]/g, '');
                expect(allowedFragments).toContain(name);
            }
        }
    });

    test('Подстановка ${name} в parnerService.js относится только к тексту ошибки', async () => {
        const fs = await import('fs');

        const source = fs.readFileSync(
            new URL('./parnerService.js', import.meta.url),
            'utf8',
        );

        const linesWithName = source
            .split('\n')
            .filter(line => line.includes('${name}'));

        expect(linesWithName.length).toBeGreaterThan(0);

        for (const line of linesWithName) {
            expect(line).toMatch(/new Error|throw/);
            expect(line).not.toMatch(/pool\.query|SELECT|INSERT|UPDATE|DELETE/);
        }
    });

    test('В materialService.js подстановок ${...} в текст запросов нет', async () => {
        const fs = await import('fs');

        const source = fs.readFileSync(
            new URL('./materialService.js', import.meta.url),
            'utf8',
        );

        const interpolatedLines = source
            .split('\n')
            .filter(line => line.includes('${'))
            .map(line => line.trim());

        expect(interpolatedLines).toEqual([]);
    });

    test('Каждый запрос с параметрами передает массив значений отдельно от SQL', async () => {
        await updatePartner(7, {
            company_name: 'ООО Ромашка',
            partner_type: 'ООО',
            rating: 5,
            legal_address: 'г. Москва',
            director_name: 'Иванов',
            contact_email: 'test@example.ru',
            phone: '+7 999 123-45-67',
        });

        const updateCall = queryCalls.find(call => call.sql.includes('UPDATE partners SET'));

        expect(updateCall).toBeDefined();
        expect(Array.isArray(updateCall.params)).toBe(true);
        expect(updateCall.params).toHaveLength(8);
        expect(updateCall.params.at(-1)).toBe(7);
    });
});

describe('Аудит безопасности: значения из тела запроса идут только через параметры', () => {
    test('Payload из всех текстовых полей не попадает в текст SQL', async () => {
        const payload = "'); TRUNCATE TABLE partners; CASCADE; --";

        await addPartner({
            company_name: payload,
            partner_type: 'ООО',
            rating: 5,
            legal_address: payload,
            director_name: payload,
            contact_email: payload,
            phone: payload,
        });

        const parameterized = queryCalls.filter(call => Array.isArray(call.params)
            && call.params.some(param => param === payload));

        expect(parameterized.length).toBeGreaterThan(0);

        for (const call of queryCalls) {
            expect(call.sql).not.toContain('TRUNCATE');
            expect(call.sql).not.toContain(payload);
        }
    });
});