import { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import SubnetExplorer from './components/SubnetExplorer'
import ValuationTools from './components/ValuationTools'
import Research from './components/Research'
import Academy from './components/Academy'
import News from './components/News'
import LoginModal from './components/LoginModal'

function App() {
  const [activeView, setActiveView] = useState('overview')
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  const renderView = () => {
    switch (activeView) {
      case 'overview': return <Dashboard />
      case 'subnet': return <SubnetExplorer />
      case 'valuation': return <ValuationTools />
      case 'research': return <Research />
      case 'academy': return <Academy />
      case 'intelligence': return <News />
      default: return <Dashboard />
    }
  }

  return (
    <>
      <Header onLogin={() => setIsLoginOpen(true)} />
      <div className="main">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="cont">
          {renderView()}
        </main>
      </div>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  )
}

export default App
