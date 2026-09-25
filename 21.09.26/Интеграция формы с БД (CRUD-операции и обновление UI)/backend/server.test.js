import { calculatePartnerDiscount } from './services/parnerService.js';

describe('Тестирование функции calculatePartnerDiscount', () => {

    test('Объем 0 ед. (нет истории продаж) должен возвращать 0%', () => {
        const result = calculatePartnerDiscount(0);
        expect(result).toBe(0);
    });

    test('null (нет истории продаж) должен возвращать 0% без ошибки', () => {
        const result = calculatePartnerDiscount(null);
        expect(result).toBe(0);
    });

    test('undefined должен безопасно возвращать 0%', () => {
        const result = calculatePartnerDiscount(undefined);
        expect(result).toBe(0);
    });

    test('Объем 9999 ед. должен возвращать 0%', () => {
        const result = calculatePartnerDiscount(9999);
        expect(result).toBe(0);
    });

    test('Объем ровно 10000 ед. должен возвращать 5%', () => {
        const result = calculatePartnerDiscount(10000);
        expect(result).toBe(5);
    });

    test('Объем 49999 ед. должен возвращать 5%', () => {
        const result = calculatePartnerDiscount(49999);
        expect(result).toBe(5);
    });

    test('Объем ровно 50000 ед. должен возвращать 10%', () => {
        const result = calculatePartnerDiscount(50000);
        expect(result).toBe(10);
    });

    test('Объем ровно 300000 ед. должен возвращать 15%', () => {
        const result = calculatePartnerDiscount(300000);
        expect(result).toBe(15);
    });

    test('Объем выше лимита (500000 ед.) должен возвращать 15%', () => {
        const result = calculatePartnerDiscount(500000);
        expect(result).toBe(15);
    });

});
