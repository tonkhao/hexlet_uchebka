interface PartnerCardProps {
    id: number
    name: string
    discount: number
}

function PartnerCard({ id, name, discount }: PartnerCardProps) {
    return (
        <div>
            <p>{id}</p>
            <p>{name}</p>
            <p>{discount}%</p>
        </div>
    )
}


export default PartnerCard