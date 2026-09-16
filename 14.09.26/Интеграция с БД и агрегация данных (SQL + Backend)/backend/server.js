export function calculatePartnerDiscount(totalQuantity) {
    if (totalQuantity < 10000) {
        return 0;
    }
    if (totalQuantity < 50000) {
        return 5;
    }
    if (totalQuantity < 300000) {
        return 10;
    }
    return 15;
}
