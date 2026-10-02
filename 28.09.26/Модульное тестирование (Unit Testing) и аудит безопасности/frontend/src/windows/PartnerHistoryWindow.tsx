import { useEffect, useMemo, useState } from 'react'
import './PartnerHistoryWindow.css'
import type { SaleHistoryItem, SalesHistoryDto } from '../types'
import MessageBox, { type MessageBoxData } from '../components/MessageBox'
import HistoryIcon from '../components/HistoryIcon'
import logo from '../assets/fakeLogo.png'

const API_BASE = 'http://localhost:8000/api'

interface PartnerHistoryWindowProps {
    partnerId: number
    onBack: () => void
}

// Итоги по объемам считаются на клиенте из уже загруженной выборки,
// чтобы менеджер сразу видел общий объем реализации партнера
function sumQuantity(items: SaleHistoryItem[]) {
    return items.reduce((total, item) => total + item.quantity, 0)
}

function formatTotal(value: number) {
    return new Intl.NumberFormat('ru-RU').format(value)
}

function PartnerHistoryWindow({ partnerId, onBack }: PartnerHistoryWindowProps) {
    const [partnerName, setPartnerName] = useState('')
    const [items, setItems] = useState<SaleHistoryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [dialog, setDialog] = useState<MessageBoxData | null>(null)

    const title = partnerName
        ? `CRM: История реализации продукции — ${partnerName}`
        : 'CRM: История реализации продукции'

    useEffect(() => {
        document.title = title
    }, [title])

    // partner_id, переданный из главной формы, определяет выборку отгрузок
    useEffect(() => {
        let cancelled = false

        fetch(`${API_BASE}/partners/${partnerId}/sales-history`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('СУБД недоступна или партнер не найден')
                }
                return response.json()
            })
            .then((data: SalesHistoryDto) => {
                if (cancelled) {
                    return
                }
                setPartnerName(data.company_name ?? '')
                setItems((data.history ?? []).map(row => ({
                    saleId: Number(row.sale_id),
                    productName: row.product_name ?? '',
                    quantity: Number(row.quantity) || 0,
                    saleDate: row.sale_date ?? '',
                })))
            })
            .catch(err => {
                if (cancelled) {
                    return
                }
                setDialog({
                    type: 'error',
                    title: 'Ошибка',
                    message: `Не удалось загрузить историю реализации продукции из базы данных: ${err instanceof Error ? err.message : 'неизвестная ошибка'}. Проверьте подключение к серверу и повторите попытку.`,
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
    }, [partnerId])

    const totalQuantity = useMemo(() => sumQuantity(items), [items])

    function handleDialogConfirm() {
        const action = dialog?.action
        setDialog(null)
        if (action === 'go-back') {
            onBack()
        }
    }

    return (
        <div className="partner-history-window">
            <div className="app-logo">
                <img src={logo} alt="Логотип"/>
            </div>
            <div className="main-title">
                <h1>{title}</h1>
            </div>
            <div className="history-toolbar">
                <span className="history-icon-badge">
                    <HistoryIcon size={20}/>
                </span>
                <div className="history-summary">
                    {isLoading
                        ? 'Загружаем историю реализации...'
                        : `Отгрузок: ${items.length}. Общий объем: ${formatTotal(totalQuantity)} шт.`}
                </div>
                <button type="button" className="history-back-button" onClick={onBack}>
                    Назад
                </button>
            </div>
            {isLoading && (
                <div className="history-loading">Загружаем данные из базы данных...</div>
            )}
            {!isLoading && items.length === 0 && (
                <div className="history-empty">
                    У партнера нет зафиксированных отгрузок продукции.
                </div>
            )}
            {!isLoading && items.length > 0 && (
                <table className="history-table">
                    <thead>
                    <tr>
                        <th scope="col">Наименование продукции</th>
                        <th scope="col" className="history-column-quantity">Количество (шт.)</th>
                        <th scope="col" className="history-column-date">Дата продажи</th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map(item => (
                        <tr key={item.saleId}>
                            <td>{item.productName}</td>
                            <td className="history-column-quantity">{formatTotal(item.quantity)}</td>
                            <td className="history-column-date">{item.saleDate}</td>
                        </tr>
                    ))}
                    </tbody>
                    <tfoot>
                    <tr>
                        <td>Итого</td>
                        <td className="history-column-quantity">{formatTotal(totalQuantity)}</td>
                        <td className="history-column-date">—</td>
                    </tr>
                    </tfoot>
                </table>
            )}
            {dialog && (
                <MessageBox data={dialog} onConfirm={handleDialogConfirm} onCancel={() => setDialog(null)}/>
            )}
        </div>
    )
}

export default PartnerHistoryWindow
