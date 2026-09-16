import './PartnerCard.css'

interface PartnerCardProps {
    id: number
    name: string
    discount: number
}

function PartnerCard({name, discount}: PartnerCardProps) {
    return (
        <div className={"partner-card"}>
            <div className={"card-left-part"}>
                <div className={"partner-name"}><p>{name}</p></div>
                <div className={"ceo-phone"}><p>Директор</p>[PHONE_NUMBER_GOESHERE]</div>
                <div className={"partner-rating"}>Рейтинг: [RATING_GOESHERE]</div>
            </div>
            <div className={"card-right-part"}>
                <p>{discount}%</p>
            </div>
        </div>
    )
}


export default PartnerCard
