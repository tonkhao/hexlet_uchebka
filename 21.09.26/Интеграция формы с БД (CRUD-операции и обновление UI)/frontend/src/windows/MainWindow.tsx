import { useEffect } from 'react'
import './MainWindow.css'
import PartnerCard from '../components/PartnerCard'
import type { Partner } from '../types'
import logo from '../assets/fakeLogo.png'

interface MainWindowProps {
    partners: Partner[]
    onAddPartner: () => void
    onEditPartner: (partner: Partner) => void
}

function MainWindow({ partners, onAddPartner, onEditPartner }: MainWindowProps) {
    useEffect(() => {
        document.title = 'CRM: Реестр партнеров'
    }, [])

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
            </div>
            <div className="partners-list">
                {partners.map(partner => (
                    <PartnerCard key={partner.id} partner={partner} onEdit={onEditPartner}/>
                ))}
            </div>
        </div>
    )
}

export default MainWindow