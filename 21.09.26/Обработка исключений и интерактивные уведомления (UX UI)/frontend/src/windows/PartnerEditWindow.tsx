import { useEffect, useState, type FormEvent } from 'react'
import './PartnerEditWindow.css'
import type { PartnerDto } from '../types'
import MessageBox, { type MessageBoxData } from '../components/MessageBox'
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

interface FormValues {
    name: string
    partnerType: string
    rating: string
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

const EMPTY_FORM: FormValues = {
    name: '',
    partnerType: '',
    rating: '',
    address: '',
    director: '',
    phone: '',
    email: '',
}

// Валидация перед отправкой в БД: нарушение прерывает операцию
// и транслируется пользователю через диалог Ошибка
function validateForm(values: FormValues): PartnerFormData {
    const name = values.name.trim()
    const email = values.email.trim()
    const rating = values.rating.trim()

    if (!name) {
        throw new Error('Поле "Наименование" не заполнено. Укажите название компании и повторите попытку.')
    }

    if (!email) {
        throw new Error('Поле "Email" не заполнено. Укажите адрес электронной почты и повторите попытку.')
    }

    // Рейтинг должен быть целым неотрицательным числом; знаки и пунктуация не допускаются
    if (rating !== '' && !/^\d+$/.test(rating)) {
        throw new Error('Рейтинг должен быть целым числом от 0. Пожалуйста, удалите знаки препинания и отрицательный знак, затем повторите попытку.')
    }

    return {
        name,
        partnerType: values.partnerType,
        rating: rating === '' ? 0 : Number(rating),
        address: values.address.trim(),
        director: values.director.trim(),
        phone: values.phone.trim(),
        email,
    }
}

function isDirtyAt(values: FormValues, snapshot: FormValues) {
    return values.name !== snapshot.name ||
        values.partnerType !== snapshot.partnerType ||
        values.rating !== snapshot.rating ||
        values.address !== snapshot.address ||
        values.director !== snapshot.director ||
        values.phone !== snapshot.phone ||
        values.email !== snapshot.email
}

function PartnerEditWindow({ partnerId, onSave, onBack }: PartnerEditWindowProps) {
    const isEditing = partnerId !== null

    const [isLoading, setIsLoading] = useState(isEditing)
    const [loadFailed, setLoadFailed] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [dialog, setDialog] = useState<MessageBoxData | null>(null)

    const [values, setValues] = useState<FormValues>(EMPTY_FORM)
    // Снимок исходных значений определяет, менял ли пользователь форму
    const [snapshot, setSnapshot] = useState<FormValues>(EMPTY_FORM)
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
                    throw new Error('СУБД недоступна или партнер не найден')
                }
                return response.json()
            })
            .then((data: PartnerDto) => {
                if (cancelled) {
                    return
                }
                const loaded: FormValues = {
                    name: data.company_name ?? '',
                    partnerType: data.partner_type ?? '',
                    rating: data.rating?.toString() ?? '',
                    address: data.address ?? '',
                    director: data.director ?? '',
                    phone: data.phone ?? '',
                    email: data.email ?? '',
                }
                setValues(loaded)
                setSnapshot(loaded)
                setDiscountFromDb(Number(data.discountPercentage) || 0)
            })
            .catch(err => {
                if (cancelled) {
                    return
                }
                setLoadFailed(true)
                setDialog({
                    type: 'error',
                    title: 'Ошибка',
                    message: `Не удалось загрузить данные партнера из базы данных: ${err instanceof Error ? err.message : 'неизвестная ошибка'}. Проверьте подключение к серверу и повторите попытку.`,
                    confirmLabel: 'Вернуться',
                    action: 'go-back',
                })
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

    function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
        setValues(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        setIsSaving(true)
        try {
            const data = validateForm(values)
            await onSave(data)
            setDialog({
                type: 'info',
                title: 'Информация',
                message: isEditing
                    ? `Партнер "${data.name}" был успешно изменен в базе данных.`
                    : `Партнер "${data.name}" был успешно добавлен в базу данных.`,
                confirmLabel: 'ОК',
                action: 'go-back',
            })
        } catch (err) {
            const message = err instanceof Error && /Failed to fetch|NetworkError/i.test(err.message)
                ? 'Не удалось соединиться с базой данных. Проверьте, что сервер запущен, и повторите попытку.'
                : err instanceof Error
                    ? err.message
                    : 'Не удалось сохранить партнера. Проверьте корректность данных и повторите попытку.'
            setDialog({
                type: 'error',
                title: 'Ошибка',
                message,
                confirmLabel: 'Закрыть',
                action: 'stay',
            })
        } finally {
            setIsSaving(false)
        }
    }

    // При выходе с измененной формы сначала показывается предупреждение
    function handleBackRequest() {
        if (isDirtyAt(values, snapshot)) {
            setDialog({
                type: 'warning',
                title: 'Предупреждение',
                message: 'Форма была изменена. При возврате на главную форму все несохраненные данные будут потеряны. Продолжить?',
                confirmLabel: 'Продолжить',
                cancelLabel: 'Остаться',
                action: 'confirm-back',
            })
        } else {
            onBack()
        }
    }

    function handleDialogConfirm() {
        const action = dialog?.action
        setDialog(null)
        if (action === 'confirm-back' || action === 'go-back') {
            onBack()
        }
    }

    function handleDialogCancel() {
        setDialog(null)
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
            {isEditing && (
                <div className="discount-info">
                    Текущая скидка по объему продаж: {discountFromDb}%
                </div>
            )}
            {!loadFailed && (
                <form className="partner-form" onSubmit={handleSubmit} noValidate>
                    <label className="form-field">
                        Наименование
                        <input type="text" value={values.name} onChange={e => updateField('name', e.target.value)}
                               placeholder="ООО «Ромашка»"/>
                    </label>
                    <label className="form-field">
                        Тип партнера
                        <select value={values.partnerType} onChange={e => updateField('partnerType', e.target.value)}>
                            <option value="" disabled>Выберите тип</option>
                            {PARTNER_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </label>
                    <label className="form-field">
                        Рейтинг
                        <input type="text" inputMode="numeric" value={values.rating}
                               onChange={e => updateField('rating', e.target.value)} placeholder="0"/>
                    </label>
                    <label className="form-field">
                        Адрес
                        <input type="text" value={values.address} onChange={e => updateField('address', e.target.value)}
                               placeholder="г. Москва, ул. Тверская, д. 1"/>
                    </label>
                    <label className="form-field">
                        ФИО директора
                        <input type="text" value={values.director} onChange={e => updateField('director', e.target.value)}
                               placeholder="Иванов Иван Иванович"/>
                    </label>
                    <label className="form-field">
                        Телефон
                        <input type="tel" value={values.phone} onChange={e => updateField('phone', e.target.value)}
                               placeholder="+7 (999) 123-45-67"/>
                        <span className="form-hint">Формат: +7 (XXX) XXX-XX-XX</span>
                    </label>
                    <label className="form-field">
                        Email
                        <input type="email" value={values.email} onChange={e => updateField('email', e.target.value)}
                               placeholder="example@company.ru"/>
                        <span className="form-hint">Формат: name@domain.ru</span>
                    </label>
                    <div className="form-actions">
                        <button type="submit" className="save-button" disabled={isSaving}>
                            {isSaving ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Добавить')}
                        </button>
                        <button type="button" className="cancel-button" onClick={handleBackRequest}>
                            Назад
                        </button>
                    </div>
                </form>
            )}
            {dialog && (
                <MessageBox data={dialog} onConfirm={handleDialogConfirm} onCancel={handleDialogCancel}/>
            )}
        </div>
    )
}

export default PartnerEditWindow