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

// Строка справочника типов продукции: коэффициент умножает базовый расход
export interface ProductTypeDto {
    product_type_id: number
    type_name: string
    coefficient: number
}

// Строка справочника типов материала: defect_percent добавляется к расходу
export interface MaterialTypeDto {
    material_type_id: number
    type_name: string
    defect_percent: number
}

// Оба справочника одним ответом: форма заполняет выпадающие списки
export interface MaterialReferencesDto {
    productTypes: ProductTypeDto[]
    materialTypes: MaterialTypeDto[]
}

// Ответ метода расчета. result = -1 означает, что расчет невозможен,
// и вместо числа приходит текст причины в поле error
export interface MaterialCalculationDto {
    ok: boolean
    result: number
    product_type_id: number | null
    material_type_id: number | null
    quantity: number | null
    param_1: number | null
    param_2: number | null
    basePerUnit: number | null
    netTotal: number | null
    withDefect: number | null
    defectPercent: number | null
    error: string | null
}