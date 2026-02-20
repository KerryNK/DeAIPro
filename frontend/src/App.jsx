import { useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import SubnetExplorer from './components/SubnetExplorer'
import ValuationTools from './components/ValuationTools'
import Research from './components/Research'
import ReportGenerator from './components/ReportGenerator'
import News from './components/News'
import Reports from './components/Reports'
import AdminPanel from './components/AdminPanel'
import LoginModal from './components/LoginModal'
import { AuthProvider, useAuth } from './context/AuthContext'

function AppContent() {
  const [activeView, setActiveView] = useState('overview')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isLoginOpen, openLoginModal, closeLoginModal } = useAuth()

  const renderView = () => {
    switch (activeView) {
      case 'overview': return <Dashboard />
      case 'subnet': return <SubnetExplorer />
      case 'valuation': return <ValuationTools />
      case 'research': return <Research />
      case 'academy': return <ReportGenerator />
      case 'intelligence': return <News />
      case 'reports': return <Reports />
      case 'admin': return <AdminPanel />
      default: return <Dashboard />
    }
  }

  return (
    <>
      <Header onLogin={openLoginModal} onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <div className="main">
        <Sidebar
          activeView={activeView}
          setActiveView={(view) => {
            setActiveView(view)
            setIsMobileMenuOpen(false)
          }}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <div className={`overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
        <main className="cont">
          {renderView()}
        </main>
      </div>
      <LoginModal isOpen={isLoginOpen} onClose={closeLoginModal} />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
