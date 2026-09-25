import { useEffect, useState, type FormEvent } from 'react'
import './PartnerEditWindow.css'
import type { Partner } from '../types'
import logo from '../assets/fakeLogo.png'

// Список типов партнера зафиксирован в ТЗ, поэтому колонки ComboBox заданы константой
const PARTNER_TYPES = ['ЗАО', 'ООО', 'ИП', 'ЧП', 'АО']

export interface PartnerFormData {
    name: string
    partnerType: string
    rating: number
    address: string
    director: string
    phone: string
    email: string
    discount: number
}

interface PartnerEditWindowProps {
    initialPartner?: Partner | null
    onSave: (data: PartnerFormData) => void
    onBack: () => void
}

function PartnerEditWindow({ initialPartner, onSave, onBack }: PartnerEditWindowProps) {
    const isEditing = Boolean(initialPartner)

    // При редактировании форма инициализируется данными партнера,
    // при добавлении (initialPartner = null) начинается с пустыми значениями
    const [name, setName] = useState(initialPartner?.name ?? '')
    const [partnerType, setPartnerType] = useState(initialPartner?.partnerType ?? '')
    const [rating, setRating] = useState(initialPartner?.rating.toString() ?? '')
    const [address, setAddress] = useState(initialPartner?.address ?? '')
    const [director, setDirector] = useState(initialPartner?.director ?? '')
    const [phone, setPhone] = useState(initialPartner?.phone ?? '')
    const [email, setEmail] = useState(initialPartner?.email ?? '')
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
            partnerType,
            // Рейтинг приводится к неотрицательному целому числу
            rating: Math.max(0, Math.trunc(Number(rating) || 0)),
            address: address.trim(),
            director: director.trim(),
            phone: phone.trim(),
            email: email.trim(),
            discount: Number(discount) || 0,
        })
    }

    return (
        <div className="partner-edit-window">
            <div className="app-logo">
                <img src={logo} alt="Логотип"/>
            </div>
            <div className="main-title">
                <h1>{isEditing ? 'CRM: Карточка партнера' : 'CRM: Добавить партнера'}</h1>
            </div>
            <form className="partner-form" onSubmit={handleSubmit}>
                <label className="form-field">
                    Наименование
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                           placeholder="ООО «Ромашка»" required/>
                </label>
                <label className="form-field">
                    Тип партнера
                    <select value={partnerType} onChange={e => setPartnerType(e.target.value)} required>
                        <option value="" disabled>Выберите тип</option>
                        {PARTNER_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </label>
                <label className="form-field">
                    Рейтинг
                    <input type="number" min="0" step="1" value={rating}
                           onChange={e => setRating(e.target.value)} placeholder="0"/>
                </label>
                <label className="form-field">
                    Адрес
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                           placeholder="г. Москва, ул. Тверская, д. 1"/>
                </label>
                <label className="form-field">
                    ФИО директора
                    <input type="text" value={director} onChange={e => setDirector(e.target.value)}
                           placeholder="Иванов Иван Иванович"/>
                </label>
                <label className="form-field">
                    Телефон
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                           placeholder="+7 (999) 123-45-67"/>
                    <span className="form-hint">Формат: +7 (XXX) XXX-XX-XX</span>
                </label>
                <label className="form-field">
                    Email
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                           placeholder="example@company.ru"/>
                    <span className="form-hint">Формат: name@domain.ru</span>
                </label>
                <label className="form-field">
                    Скидка, %
                    <input type="number" min="0" max="100" value={discount}
                           onChange={e => setDiscount(e.target.value)}/>
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
