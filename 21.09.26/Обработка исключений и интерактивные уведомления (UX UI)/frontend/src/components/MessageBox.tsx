import './MessageBox.css'

export type MessageBoxType = 'error' | 'warning' | 'info'

export interface MessageBoxData {
    type: MessageBoxType
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    action: 'confirm-back' | 'go-back' | 'stay'
}

interface MessageBoxProps {
    data: MessageBoxData
    onConfirm: () => void
    onCancel?: () => void
}

const ICONS: Record<MessageBoxType, string> = {
    error: '✕',
    warning: '!',
    info: 'i',
}

function MessageBox({ data, onConfirm, onCancel }: MessageBoxProps) {
    return (
        <div className="messagebox-overlay" role="presentation">
            <div className={`messagebox messagebox-${data.type}`} role="alertdialog"
                 aria-label={data.title}>
                <div className="messagebox-icon" aria-hidden="true">{ICONS[data.type]}</div>
                <div className="messagebox-body">
                    <div className="messagebox-title">{data.title}</div>
                    <div className="messagebox-message">{data.message}</div>
                    <div className="messagebox-actions">
                        <button type="button" className="messagebox-button messagebox-button-primary"
                                onClick={onConfirm}>
                            {data.confirmLabel ?? 'ОК'}
                        </button>
                        {data.cancelLabel && (
                            <button type="button" className="messagebox-button"
                                    onClick={onCancel}>
                                {data.cancelLabel}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MessageBox