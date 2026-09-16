import './PartnerCard.css'

interface PartnerCardProps {
    id: number
    name: string
    discount: number
    phone: string
    rating: number
}

function PartnerCard({name, discount, phone, rating}: PartnerCardProps) {
    return (
        <div className={"partner-card"}>
            <div className={"card-left-part"}>
                <div className={"partner-name"}><p>{name}</p></div>
                <div className={"ceo-phone"}><p>Директор</p>{phone}</div>
                <div className={"partner-rating"}>Рейтинг: {rating}</div>
            </div>
            <div className={"card-right-part"}>
                <p>{discount}%</p>
            </div>
        </div>
    )
}


export default PartnerCard
