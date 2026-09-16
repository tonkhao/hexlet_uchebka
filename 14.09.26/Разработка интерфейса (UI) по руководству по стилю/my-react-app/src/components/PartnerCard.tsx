interface PartnerCardProps {
    id: number
    name: string
    discount: number
}

function PartnerCard({name, discount}: PartnerCardProps) {
    return (
        <div>
            <div className={"cardLeftPart"}>
                <div className={"partnerName"}><p>{name}</p></div>
                <div className={"ceoPhone"}><p>Директор</p>[PHONE_NUMBER_GOESHERE]</div>
                <div className={"partnerRating"}>Рейтинг: [RATING_GOESHERE]</div>
            </div>
            <div className={"cardRightPart"}>
                <p>{discount}%</p>
            </div>
        </div>
    )
}


export default PartnerCard
