import './App.css'
import PartnerCard from './components/PartnerCard'
import logo from './assets/hero.png'

function App() {
    const partners = [
        {id: 1, name: "Партнер 1", discount: 10, phone: "8999009900", rating: 1.0},
        {id: 2, name: "Партнер 2", discount: 20, phone: "8999009900", rating: 1.1},
        {id: 3, name: "Партнер 3", discount: 30, phone: "8999009900", rating: 1.2}
    ]
    return (
        <>
            <div className={"app-logo"}>
                <img src={logo} alt="Логотип"/>
            </div>
            <div>
                <div className={"main-title"}><h1>CRM: Список партнеров и скидок</h1></div>
                {partners.map(partner => <PartnerCard id={partner.id} name={partner.name} discount={partner.discount}
                                                      phone={partner.phone} rating={partner.rating}/>)}
            </div>
        </>
    )
}

export default App
