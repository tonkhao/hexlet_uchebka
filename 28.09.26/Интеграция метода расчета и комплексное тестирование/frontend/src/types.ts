export interface Partner {
    id: number
    name: string
    partnerType: string
    rating: number
    address: string
    director: string
    phone: string
    email: string
    discount: number
}

export interface PartnerDto {
    partner_id: number
    company_name: string
    partner_type: string
    phone: string
    rating: number
    address: string
    director: string
    email: string
    discountPercentage: number
}

// Одна отгрузка в истории реализации продукции.
// productName — наименование продукции, quantity — объем в шт.,
// saleDate — дата продажи в формате DD.MM.YYYY, готовом для вывода
export interface SaleHistoryItem {
    saleId: number
    productName: string
    quantity: number
    saleDate: string
}

export interface SalesHistoryDto {
    partner_id: number
    company_name: string
    history: {
        sale_id: number
        product_name: string
        quantity: number
        sale_date: string
    }[]
}