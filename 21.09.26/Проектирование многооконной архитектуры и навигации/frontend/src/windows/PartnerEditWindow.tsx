import { useEffect, useState, type FormEvent } from 'react'
import './PartnerEditWindow.css'
import type { Partner } from '../types'
import logo from '../assets/fakeLogo.png'

export interface PartnerFormData {
    name: string
    phone: string
    rating: number
    discount: number
}

interface PartnerEditWindowProps {
    initialPartner?: Partner | null
    onSave: (data: PartnerFormData) => void
    onBack: () => void
}

function PartnerEditWindow({ initialPartner, onSave, onBack }: PartnerEditWindowProps) {
    const isEditing = Boolean(initialPartner)

    const [name, setName] = useState(initialPartner?.name ?? '')
    const [phone, setPhone] = useState(initialPartner?.phone ?? '')
    const [rating, setRating] = useState(initialPartner?.rating.toString() ?? '')
    const [discount, setDiscount] = useState(initialPartner?.discount.toString() ?? '')

    useEffect(() => {
        document.title = isEditing
            ? 'CRM: Карточка партнера [Редактирование]'
            : 'CRM: Карточка партнера [Добавление]'
    }, [isEditing])

    function handleSubmit(event: FormEvent) {
        event.preventDefault()
        onSave({
            name: name.trim(),
            phone: phone.trim(),
            rating: Number(rating) || 0,
            discount: Number(discount) || 0,
        })
    }

    return (
        <div className="partner-edit-window">
            <div className="app-logo">
                <img src={logo} alt="Логотип"/>
            </div>
            <div className="main-title">
                <h1>{isEditing ? 'CRM: Карточка партнера [Редактирование]' : 'CRM: Карточка партнера [Добавление]'}</h1>
            </div>
            <form className="partner-form" onSubmit={handleSubmit}>
                <label className="form-field">
                    Название компании
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required/>
                </label>
                <label className="form-field">
                    Телефон
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)}/>
                </label>
                <label className="form-field">
                    Рейтинг
                    <input type="number" min="0" max="10" value={rating} onChange={e => setRating(e.target.value)}/>
                </label>
                <label className="form-field">
                    Скидка, %
                    <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)}/>
                </label>
                <div className="form-actions">
                    <button type="submit" className="save-button">
                        {isEditing ? 'Сохранить' : 'Добавить'}
                    </button>
                    <button type="button" className="cancel-button" onClick={onBack}>
                        Назад
                    </button>
                </div>
            </form>
        </div>
    )
}

export default PartnerEditWindow