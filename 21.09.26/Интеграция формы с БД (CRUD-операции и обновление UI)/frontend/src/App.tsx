import { useEffect, useState } from 'react'
import './App.css'
import MainWindow from './windows/MainWindow'
import PartnerEditWindow, { type PartnerFormData } from './windows/PartnerEditWindow'
import logo from './assets/fakeLogo.png'
import type { Partner, PartnerDto } from './types'

const API_BASE = 'http://localhost:8000/api'

function toPartner(dto: PartnerDto): Partner {
    return {
        id: Number(dto.partner_id),
        name: dto.company_name,
        partnerType: dto.partner_type ?? '',
        rating: Number(dto.rating) || 0,
        address: dto.address ?? '',
        director: dto.director ?? '',
        phone: dto.phone ?? '',
        email: dto.email ?? '',
        discount: Number(dto.discountPercentage) || 0,
    }
}

type WindowType = 'main' | 'edit'

function App() {
    const [partners, setPartners] = useState<Partner[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentWindow, setCurrentWindow] = useState<WindowType>('main')
    // null — режим добавления, иначе id партнера для подгрузки карточки из БД
    const [editingPartnerId, setEditingPartnerId] = useState<number | null>(null)

    function reloadPartners() {
        return fetch(`${API_BASE}/partners`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ошибка сервера: ${response.status}`)
                }
                return response.json()
            })
            .then((data: PartnerDto[]) => setPartners(data.map(toPartner)))
    }

    useEffect(() => {
        reloadPartners()
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    function openAddPartner() {
        setEditingPartnerId(null)
        setCurrentWindow('edit')
    }

    function openEditPartner(partner: Partner) {
        setEditingPartnerId(partner.id)
        setCurrentWindow('edit')
    }

    function goBack() {
        setCurrentWindow('main')
    }

    async function handleSave(data: PartnerFormData) {
        const body = {
            company_name: data.name,
            partner_type: data.partnerType,
            rating: data.rating,
            legal_address: data.address,
            director_name: data.director,
            contact_email: data.email,
            phone: data.phone,
        }

        const url = editingPartnerId === null
            ? `${API_BASE}/partners`
            : `${API_BASE}/partners/${editingPartnerId}`
        const method = editingPartnerId === null ? 'POST' : 'PUT'

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const payload = await response.json().catch(() => null)
            throw new Error(payload?.error ?? `Ошибка сервера: ${response.status}`)
        }

        // После записи в БД перечитываем список, чтобы главная форма была актуальной
        await reloadPartners()
        goBack()
    }

    if (currentWindow === 'edit') {
        return (
            <PartnerEditWindow partnerId={editingPartnerId} onSave={handleSave} onBack={goBack}/>
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