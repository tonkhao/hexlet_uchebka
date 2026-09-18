import { useEffect, useState } from 'react'
import './App.css'
import PartnerCard from './components/PartnerCard'
import logo from './assets/fakeLogo.png'

interface Partner {
    id: number
    name: string
    discount: number
    phone: string
    rating: number
}

interface PartnerDto {
    partner_id: number
    company_name: string
    phone: string
    rating: number
    discountPercentage: number
}

function App() {
    const [partners, setPartners] = useState<Partner[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
        <>
            <div className="app-logo">
                <img src={logo} alt="Логотип"/>
            </div>
            <div>
                <div className="main-title"><h1>CRM: Список партнеров и скидок</h1></div>
                {partners.map(partner => (
                    <PartnerCard key={partner.id} id={partner.id} name={partner.name}
                                 discount={partner.discount} phone={partner.phone} rating={partner.rating}/>
                ))}
            </div>
        </>
    )
}

export default App
