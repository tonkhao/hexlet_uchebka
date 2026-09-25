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