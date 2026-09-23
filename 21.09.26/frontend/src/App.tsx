import { useEffect, useState } from 'react'
import './App.css'
import MainWindow from './windows/MainWindow'
import PartnerEditWindow, { type PartnerFormData } from './windows/PartnerEditWindow'
import logo from './assets/fakeLogo.png'
import type { Partner } from './types'

interface PartnerDto {
    partner_id: number
    company_name: string
    phone: string
    rating: number
    discountPercentage: number
}

type WindowType = 'main' | 'edit'

function nextPartnerId(partners: Partner[]) {
    return partners.reduce((maxId, partner) => Math.max(maxId, partner.id), 0) + 1
}

function App() {
    const [partners, setPartners] = useState<Partner[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentWindow, setCurrentWindow] = useState<WindowType>('main')
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null)

    useEffect(() => {
        fetch('http://localhost:8000/api/partners')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ошибка сервера: ${response.status}`)
                }
                return response.json()
            })
            .then((data: PartnerDto[]) => {
                setPartners(data.map(p => ({
                    id: Number(p.partner_id),
                    name: p.company_name,
                    discount: Number(p.discountPercentage) || 0,
                    phone: p.phone ?? '',
                    rating: Number(p.rating) || 0,
                })))
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    function openAddPartner() {
        setEditingPartner(null)
        setCurrentWindow('edit')
    }

    function openEditPartner(partner: Partner) {
        setEditingPartner(partner)
        setCurrentWindow('edit')
    }

    function goBack() {
        setCurrentWindow('main')
    }

    function handleSave(data: PartnerFormData) {
        if (editingPartner) {
            setPartners(prev => prev.map(p => p.id === editingPartner.id ? { ...p, ...data } : p))
        } else {
            setPartners(prev => [...prev, { id: nextPartnerId(prev), ...data }])
        }
        goBack()
    }

    if (currentWindow === 'edit') {
        return (
            <PartnerEditWindow initialPartner={editingPartner} onSave={handleSave} onBack={goBack}/>
        )
    }

    if (loading) {
        return (
            <div className="app-logo">
                <img src={logo} alt="Логотип"/>
            </div>
        )
    }

    if (error) {
        return (
            <>
                <div className="app-logo">
                    <img src={logo} alt="Логотип"/>
                </div>
                <div className="main-title"><h1>Не удалось загрузить партнеров</h1></div>
                <div className="main-title"><p>{error}</p></div>
            </>
        )
    }

    return (
        <MainWindow partners={partners} onAddPartner={openAddPartner} onEditPartner={openEditPartner}/>
    )
}

export default App