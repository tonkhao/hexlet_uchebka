import './App.css'
import PartnerCard from './components/PartnerCard'

function App() {
    const partners = [
        {id: 1, name: "1", discount: 10},
        {id: 2, name: "2", discount: 20},
        {id: 3, name: "3", discount: 30}
    ]
    return (
        <>
          <div>
            LOGO
          </div>
          <div>
            <div>CRM: Список партнеров и скидок</div>
            {partners.map(partner => <PartnerCard id={partner.id} name={partner.name} discount={partner.discount}/>)}
          </div>
        </>
    )
}

export default App
