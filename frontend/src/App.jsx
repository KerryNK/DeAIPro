import { useState, useEffect, lazy, Suspense } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import LoginModal from './components/LoginModal'
import { AuthProvider, useAuth } from './context/AuthContext'

// ── Lazy-load heavy view components for code splitting ─────────────────────────
// Each becomes its own JS chunk — reduces initial bundle from ~960 kB
const Dashboard = lazy(() => import('./components/Dashboard'))
const SubnetExplorer = lazy(() => import('./components/SubnetExplorer'))
const ValuationTools = lazy(() => import('./components/ValuationTools'))
const Research = lazy(() => import('./components/Research'))
const ReportGenerator = lazy(() => import('./components/ReportGenerator'))
const News = lazy(() => import('./components/News'))
const Reports = lazy(() => import('./components/Reports'))
const AdminPanel = lazy(() => import('./components/AdminPanel'))

// ── Simple loading fallback shown during lazy chunk load ──────────────────────
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
    <div className="chart-spinner" style={{ width: '36px', height: '36px' }} />
    <span style={{ fontSize: '13px', color: 'var(--mute)' }}>Loading…</span>
  </div>
)

function AppContent() {
  const [activeView, setActiveView] = useState('overview')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isLoginOpen, openLoginModal, closeLoginModal } = useAuth()

  // ── Dark mode — persisted to localStorage, defaults to dark ───────────────
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('deai_dark_mode')
    return saved !== null ? saved === 'true' : true
  })

  useEffect(() => {
    document.body.classList.toggle('light', !darkMode)
    localStorage.setItem('deai_dark_mode', darkMode)
  }, [darkMode])

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
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
        />
        <div
          className={`overlay ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <main className="cont">
          <Suspense fallback={<PageLoader />}>
            {renderView()}
          </Suspense>
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
