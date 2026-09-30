// Иконка истории реализации продукции. Цвет наследуется от кнопки,
// чтобы соответствовать палитре интерфейса (зелёный акцент #2ecc71).
interface HistoryIconProps {
    size?: number
}

function HistoryIcon({ size = 16 }: HistoryIconProps) {
    return (
        <svg
            className="history-icon"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            <path d="M3 3v5h5"/>
            <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
            <path d="M12 7v5l4 2"/>
        </svg>
    )
}

export default HistoryIcon
