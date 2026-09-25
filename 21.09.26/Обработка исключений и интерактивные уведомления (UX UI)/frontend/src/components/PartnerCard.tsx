import './PartnerCard.css'
import type { Partner } from '../types'

interface PartnerCardProps {
    partner: Partner
    onEdit: (partner: Partner) => void
}

function PartnerCard({ partner, onEdit }: PartnerCardProps) {
    // Клик или двойной клик по карточке открывает редактирование партнера
    return (
        <div className="partner-card" onClick={() => onEdit(partner)} onDoubleClick={() => onEdit(partner)}>
            <div className="card-left-part">
                <div className="partner-name"><p>{partner.name}</p></div>
                <div className="ceo-phone"><p>Директор</p>{partner.phone}</div>
                <div className="partner-rating">Рейтинг: {partner.rating}</div>
            </div>
            <div className="card-right-part">
                <p>{partner.discount}%</p>
            </div>
            <div className="card-edit-part">
                <button type="button" className="edit-partner-button" onClick={() => onEdit(partner)}>
                    Редактировать
                </button>
            </div>
        </div>
    )
}


export default PartnerCard