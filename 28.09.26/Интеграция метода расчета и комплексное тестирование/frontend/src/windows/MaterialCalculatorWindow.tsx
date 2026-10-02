import { useEffect, useState, type FormEvent } from 'react'
import './MaterialCalculatorWindow.css'
import type {
    MaterialCalculationDto,
    MaterialReferencesDto,
    MaterialTypeDto,
    ProductTypeDto,
} from '../types'
import MessageBox, { type MessageBoxData } from '../components/MessageBox'
import logo from '../assets/fakeLogo.png'

const API_BASE = 'http://localhost:8000/api'

// Значение, которым метод расчета сигнализирует о невозможности расчета
const CALCULATION_ERROR = -1

interface MaterialCalculatorWindowProps {
    onBack: () => void
}

interface FormValues {
    productTypeId: string
    materialTypeId: string
    quantity: string
    param1: string
    param2: string
}

const EMPTY_FORM: FormValues = {
    productTypeId: '',
    materialTypeId: '',
    quantity: '',
    param1: '',
    param2: '',
}

// Ввод хранится строкой: пустое поле не должно молча превращаться в 0,
// потому что 0 для quantity означает ошибку, а не «не введено»
function toNumberOrNull(raw: string) {
    const trimmed = raw.trim()
    if (trimmed === '') {
        return null
    }
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) {
        return Number.NaN
    }
    return parsed
}

// Дробная часть допустима, запятая привычна менеджеру
function toBackendNumber(raw: string) {
    return toNumberOrNull(raw.replace(',', '.'))
}

function formatNumber(value: number | null) {
    if (value === null || !Number.isFinite(value)) {
        return '—'
    }
    const rounded = Math.round(value * 10000) / 10000
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 4 }).format(rounded)
}

function formatInteger(value: number) {
    return new Intl.NumberFormat('ru-RU').format(value)
}

function MaterialCalculatorWindow({ onBack }: MaterialCalculatorWindowProps) {
    const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([])
    const [materialTypes, setMaterialTypes] = useState<MaterialTypeDto[]>([])
    const [values, setValues] = useState<FormValues>(EMPTY_FORM)
    const [calculation, setCalculation] = useState<MaterialCalculationDto | null>(null)
    const [isLoadingReferences, setIsLoadingReferences] = useState(true)
    const [isCalculating, setIsCalculating] = useState(false)
    const [dialog, setDialog] = useState<MessageBoxData | null>(null)

    useEffect(() => {
        document.title = 'CRM: Калькулятор материалов'
    }, [])

    // Справочники подгружаются один раз: списки типов меняются только вручную
    useEffect(() => {
        let cancelled = false

        fetch(`${API_BASE}/materials/references`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ошибка сервера: ${response.status}`)
                }
                return response.json()
            })
            .then((data: MaterialReferencesDto) => {
                if (cancelled) {
                    return
                }
                setProductTypes(data.productTypes ?? [])
                setMaterialTypes(data.materialTypes ?? [])
            })
            .catch(err => {
                if (cancelled) {
                    return
                }
                setDialog({
                    type: 'error',
                    title: 'Ошибка',
                    message: `Не удалось загрузить справочники типов: ${err instanceof Error ? err.message : 'неизвестная ошибка'}. Проверьте подключение к серверу и повторите попытку.`,
                    confirmLabel: 'Закрыть',
                    action: 'stay',
                })
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoadingReferences(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [])

    function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
        setValues(prev => ({ ...prev, [field]: value }))
    }

    // Метод возвращает -1 и HTTP 400 при отказе. Это штатная ситуация,
    // поэтому результат показывается пользователю, а форма остается рабочей
    function applyCalculation(dto: MaterialCalculationDto) {
        setCalculation(dto)

        if (dto.result === CALCULATION_ERROR) {
            setDialog({
                type: 'error',
                title: 'Ошибка',
                message: `Расчет не выполнен: ${dto.error ?? 'неизвестная ошибка'}. Проверьте введенные данные и повторите попытку.`,
                confirmLabel: 'Закрыть',
                action: 'stay',
            })
        }
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        setIsCalculating(true)
        setCalculation(null)

        const body = {
            product_type_id: toNumberOrNull(values.productTypeId),
            material_type_id: toNumberOrNull(values.materialTypeId),
            quantity: toBackendNumber(values.quantity),
            param_1: toBackendNumber(values.param1),
            param_2: toBackendNumber(values.param2),
        }

        try {
            const response = await fetch(`${API_BASE}/materials/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const payload = await response.json().catch(() => null)

            if (payload === null) {
                throw new Error(`Сервер вернул ответ без данных (код ${response.status})`)
            }

            applyCalculation(payload as MaterialCalculationDto)
        } catch (err) {
            // Сеть недоступна либо ответ не распознан — интерфейс не падает
            const isNetworkFailure = err instanceof Error
                && /Failed to fetch|NetworkError/i.test(err.message)

            setDialog({
                type: 'error',
                title: 'Ошибка',
                message: isNetworkFailure
                    ? 'Не удалось соединиться с базой данных. Проверьте, что сервер запущен, и повторите попытку.'
                    : `Не удалось выполнить расчет: ${err instanceof Error ? err.message : 'неизвестная ошибка'}.`,
                confirmLabel: 'Закрыть',
                action: 'stay',
            })
        } finally {
            setIsCalculating(false)
        }
    }

    // Справка по выбранным типам показывает справочные значения,
    // чтобы менеджер видел влияние коэффициента и брака до расчета
    const selectedProductType = productTypes.find(
        type => String(type.product_type_id) === values.productTypeId,
    )
    const selectedMaterialType = materialTypes.find(
        type => String(type.material_type_id) === values.materialTypeId,
    )

    function handleDialogClose() {
        setDialog(null)
    }

    const isSuccess = calculation !== null && calculation.result !== CALCULATION_ERROR
    const isFailed = calculation !== null && calculation.result === CALCULATION_ERROR

    return (
        <div className="material-calculator-window">
            <div className="app-logo">
                <img src={logo} alt="Логотип"/>
            </div>
            <div className="main-title">
                <h1>CRM: Калькулятор материалов</h1>
            </div>
            {isLoadingReferences && (
                <div className="form-loading">Загружаем справочники типов...</div>
            )}
            <form className="material-form" onSubmit={handleSubmit} noValidate>
                <label className="form-field">
                    Тип продукции
                    <select
                        value={values.productTypeId}
                        onChange={e => updateField('productTypeId', e.target.value)}
                    >
                        <option value="" disabled>Выберите тип</option>
                        {productTypes.map(type => (
                            <option key={type.product_type_id} value={type.product_type_id}>
                                {type.type_name}
                            </option>
                        ))}
                    </select>
                    {selectedProductType && (
                        <span className="form-hint">
                            Коэффициент типа продукции: {formatNumber(selectedProductType.coefficient)}
                        </span>
                    )}
                </label>
                <label className="form-field">
                    Тип материала
                    <select
                        value={values.materialTypeId}
                        onChange={e => updateField('materialTypeId', e.target.value)}
                    >
                        <option value="" disabled>Выберите тип</option>
                        {materialTypes.map(type => (
                            <option key={type.material_type_id} value={type.material_type_id}>
                                {type.type_name}
                            </option>
                        ))}
                    </select>
                    {selectedMaterialType && (
                        <span className="form-hint">
                            Процент брака материала: {formatNumber(selectedMaterialType.defect_percent)}%
                        </span>
                    )}
                </label>
                <label className="form-field">
                    Количество продукции, шт.
                    <input
                        type="text"
                        inputMode="numeric"
                        value={values.quantity}
                        onChange={e => updateField('quantity', e.target.value)}
                        placeholder="100"
                    />
                    <span className="form-hint">Целое число больше нуля</span>
                </label>
                <label className="form-field">
                    Параметр изделия 1
                    <input
                        type="text"
                        inputMode="decimal"
                        value={values.param1}
                        onChange={e => updateField('param1', e.target.value)}
                        placeholder="2.5"
                    />
                </label>
                <label className="form-field">
                    Параметр изделия 2
                    <input
                        type="text"
                        inputMode="decimal"
                        value={values.param2}
                        onChange={e => updateField('param2', e.target.value)}
                        placeholder="4"
                    />
                </label>
                <div className="form-actions">
                    <button type="submit" className="save-button" disabled={isCalculating}>
                        {isCalculating ? 'Расчет...' : 'Рассчитать'}
                    </button>
                    <button type="button" className="cancel-button" onClick={onBack}>
                        Назад
                    </button>
                </div>
            </form>
            {isSuccess && (
                <div className="calculation-result">
                    <div className="calculation-result-label">Требуемое количество материала</div>
                    <div className="calculation-result-value">
                        {formatInteger(calculation.result)}
                        <span className="calculation-result-unit">шт.</span>
                    </div>
                    <table className="calculation-details">
                        <tbody>
                        <tr>
                            <td>Базовый расход на 1 ед.</td>
                            <td>{formatNumber(calculation.basePerUnit)}</td>
                        </tr>
                        <tr>
                            <td>Чистый расход на партию</td>
                            <td>{formatNumber(calculation.netTotal)}</td>
                        </tr>
                        <tr>
                            <td>Процент брака материала</td>
                            <td>{formatNumber(calculation.defectPercent)}%</td>
                        </tr>
                        <tr>
                            <td>Расход с учетом брака</td>
                            <td>{formatNumber(calculation.withDefect)}</td>
                        </tr>
                        <tr>
                            <td>Итого с округлением вверх</td>
                            <td>{formatInteger(calculation.result)}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            )}
            {isFailed && (
                <div className="form-error">
                    Расчет невозможен: {calculation.error ?? 'неизвестная ошибка'}
                </div>
            )}
            {dialog && (
                <MessageBox data={dialog} onConfirm={handleDialogClose} onCancel={handleDialogClose}/>
            )}
        </div>
    )
}

export default MaterialCalculatorWindow