import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StoreProvider } from './store.jsx'
import { AuthProvider, useAuth } from './auth.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import Dashboard from './components/Dashboard.jsx'
import AddExpense from './components/AddExpense.jsx'
import Analytics from './components/Analytics.jsx'
import Expenses from './components/Expenses.jsx'
import Wallet from './components/Wallet.jsx'

const TABS = [
  { id: 'home', label: 'Overview', icon: '🪙' },
  { id: 'add', label: 'Add', icon: '➕' },
  { id: 'expenses', label: 'Expenses', icon: '📒' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'wallet', label: 'Wallet', icon: '💳' },
]

function Aurora() {
  return (
    <div className="aurora" aria-hidden>
      <motion.div
        className="blob"
        style={{ background: 'radial-gradient(circle, #e8c16855 0%, transparent 62%)', top: '-18%', left: '-12%' }}
        animate={{ x: [0, 60, -20, 0], y: [0, 30, 60, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="blob"
        style={{ background: 'radial-gradient(circle, #4a3aa766 0%, transparent 62%)', bottom: '-22%', right: '-14%' }}
        animate={{ x: [0, -50, 20, 0], y: [0, -40, -10, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="blob"
        style={{ background: 'radial-gradient(circle, #1c5cab55 0%, transparent 62%)', top: '30%', right: '20%', width: '30vw', height: '30vw' }}
        animate={{ x: [0, 40, 0], y: [0, -50, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

function Shell() {
  const { user, ready, logout } = useAuth()
  const [tab, setTab] = useState(() => {
    const h = window.location.hash.slice(1)
    return TABS.some((t) => t.id === h) ? h : 'home'
  })

  useEffect(() => {
    if (user) window.history.replaceState(null, '', tab === 'home' ? '#' : `#${tab}`)
  }, [tab, user])

  if (!ready) return null

  if (!user) {
    return (
      <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <AuthScreen />
      </motion.div>
    )
  }

  const firstName = user.name.split(' ')[0]

  return (
    <StoreProvider key={user.id} userId={user.id}>
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <span className="coin-dot">¢</span>
            Cent<em>sible</em>
          </div>
          <nav className="nav desktop-nav">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
                {tab === t.id && (
                  <motion.span
                    className="nav-pill" layoutId="nav-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="user-chip">
            <span className="user-avatar" title={user.email}>{firstName[0]?.toUpperCase()}</span>
            <span className="user-name">{firstName}</span>
            <button className="user-logout" onClick={logout} title="Sign out">⏻</button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {tab === 'home' && <Dashboard goTo={setTab} />}
            {tab === 'add' && <AddExpense goTo={setTab} />}
            {tab === 'expenses' && <Expenses />}
            {tab === 'analytics' && <Analytics />}
            {tab === 'wallet' && <Wallet />}
          </motion.main>
        </AnimatePresence>
      </div>

      <nav className="bottomnav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span className="bn-icon">{t.icon}</span>
            <span className="bn-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </StoreProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Aurora />
      <Shell />
    </AuthProvider>
  )
}
