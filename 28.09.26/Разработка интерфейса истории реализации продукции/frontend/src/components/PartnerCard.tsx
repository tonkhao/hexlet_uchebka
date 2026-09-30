import './PartnerCard.css'
import type { Partner } from '../types'
import HistoryIcon from './HistoryIcon'

interface PartnerCardProps {
    partner: Partner
    isSelected: boolean
    onSelect: (partner: Partner) => void
    onEdit: (partner: Partner) => void
    onShowHistory: (partner: Partner) => void
}

function PartnerCard({ partner, isSelected, onSelect, onEdit, onShowHistory }: PartnerCardProps) {
    // Клик по карточке выбирает партнера в списке; отдельные кнопки
    // открывают редактирование и историю реализации продукции
    return (
        <div
            className={`partner-card${isSelected ? ' partner-card-selected' : ''}`}
            onClick={() => onSelect(partner)}
            onDoubleClick={() => onEdit(partner)}
        >
            <div className="card-left-part">
                <div className="partner-name"><p>{partner.name}</p></div>
                <div className="ceo-phone"><p>Директор</p>{partner.phone}</div>
                <div className="partner-rating">Рейтинг: {partner.rating}</div>
            </div>
            <div className="card-right-part">
                <p>{partner.discount}%</p>
            </div>
            <div className="card-edit-part">
                <button type="button" className="history-button" onClick={() => onShowHistory(partner)}>
                    <HistoryIcon/>
                    История продаж
                </button>
                <button type="button" className="edit-partner-button" onClick={() => onEdit(partner)}>
                    Редактировать
                </button>
            </div>
        </div>
    )
}


export default PartnerCard
