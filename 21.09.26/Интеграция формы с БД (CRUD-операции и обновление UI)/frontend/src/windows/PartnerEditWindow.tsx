import { useEffect, useState, type FormEvent } from 'react'
import './PartnerEditWindow.css'
import type { PartnerDto } from '../types'
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
}

interface PartnerEditWindowProps {
    partnerId: number | null
    onSave: (data: PartnerFormData) => Promise<void>
    onBack: () => void
}

function PartnerEditWindow({ partnerId, onSave, onBack }: PartnerEditWindowProps) {
    const isEditing = partnerId !== null

    const [isLoading, setIsLoading] = useState(isEditing)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [name, setName] = useState('')
    const [partnerType, setPartnerType] = useState('')
    const [rating, setRating] = useState('')
    const [address, setAddress] = useState('')
    const [director, setDirector] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [discountFromDb, setDiscountFromDb] = useState(0)

    // В режиме редактирования карточка подгружает актуальные данные из БД;
    // в режиме добавления (partnerId = null) форма начинает пустой
    useEffect(() => {
        document.title = isEditing
            ? 'CRM: Карточка партнера [Редактирование]'
            : 'CRM: Карточка партнера [Добавление]'

        if (!isEditing) {
            return
        }

        let cancelled = false

        fetch(`http://localhost:8000/api/partner/${partnerId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ошибка сервера: ${response.status}`)
                }
                return response.json()
            })
            .then((data: PartnerDto) => {
                if (cancelled) {
                    return
                }
                setName(data.company_name ?? '')
                setPartnerType(data.partner_type ?? '')
                setRating(data.rating?.toString() ?? '')
                setAddress(data.address ?? '')
                setDirector(data.director ?? '')
                setPhone(data.phone ?? '')
                setEmail(data.email ?? '')
                setDiscountFromDb(Number(data.discountPercentage) || 0)
            })
            .catch(err => {
                if (!cancelled) {
                    setError(err.message)
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [partnerId, isEditing])

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        setIsSaving(true)
        setError(null)
        try {
            await onSave({
                name: name.trim(),
                partnerType,
                // Рейтинг приводится к неотрицательному целому числу
                rating: Math.max(0, Math.trunc(Number(rating) || 0)),
                address: address.trim(),
                director: director.trim(),
                phone: phone.trim(),
                email: email.trim(),
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось сохранить партнера')
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="partner-edit-window">
                <div className="app-logo">
                    <img src={logo} alt="Логотип"/>
                </div>
                <div className="main-title"><h1>CRM: Карточка партнера [Редактирование]</h1></div>
                <div className="form-loading">Загружаем данные партнера...</div>
            </div>
        )
    }

    return (
        <div className="partner-edit-window">
            <div className="app-logo">
                <img src={logo} alt="Логотип"/>
            </div>
            <div className="main-title">
                <h1>{isEditing ? 'CRM: Карточка партнера [Редактирование]' : 'CRM: Карточка партнера [Добавление]'}</h1>
            </div>
            {error && <div className="form-error">{error}</div>}
            {isEditing && (
                <div className="discount-info">
                    Текущая скидка по объему продаж: {discountFromDb}%
                </div>
            )}
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
                <div className="form-actions">
                    <button type="submit" className="save-button" disabled={isSaving}>
                        {isSaving ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Добавить')}
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