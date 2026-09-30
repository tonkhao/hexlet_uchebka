import { useEffect } from 'react'
import './MainWindow.css'
import PartnerCard from '../components/PartnerCard'
import type { Partner } from '../types'
import logo from '../assets/fakeLogo.png'

interface MainWindowProps {
    partners: Partner[]
    selectedPartnerId: number | null
    onAddPartner: () => void
    onSelectPartner: (partner: Partner) => void
    onEditPartner: (partner: Partner) => void
    onShowHistory: (partner: Partner) => void
}

function MainWindow({
    partners,
    selectedPartnerId,
    onAddPartner,
    onSelectPartner,
    onEditPartner,
    onShowHistory,
}: MainWindowProps) {
    useEffect(() => {
        document.title = 'CRM: Реестр партнеров'
    }, [])

    const selectedPartner = partners.find(partner => partner.id === selectedPartnerId) ?? null

    return (
        <div className="main-window">
            <div className="app-logo">
                <img src={logo} alt="Логотип"/>
            </div>
            <div className="main-title"><h1>CRM: Реестр партнеров</h1></div>
            <div className="toolbar">
                <button type="button" className="add-partner-button" onClick={onAddPartner}>
                    Добавить партнера
                </button>
                {/* История открывается для партнера, выбранного в списке */}
                <button
                    type="button"
                    className="history-sales-button"
                    disabled={!selectedPartner}
                    onClick={() => selectedPartner && onShowHistory(selectedPartner)}
                >
                    История продаж
                </button>
            </div>
            {selectedPartner && (
                <div className="selected-partner-hint">
                    Выбран партнер: {selectedPartner.name}
                </div>
            )}
            <div className="partners-list">
                {partners.map(partner => (
                    <PartnerCard
                        key={partner.id}
                        partner={partner}
                        isSelected={partner.id === selectedPartnerId}
                        onSelect={onSelectPartner}
                        onEdit={onEditPartner}
                        onShowHistory={onShowHistory}
                    />
                ))}
            </div>
        </div>
    )
}

export default MainWindow
