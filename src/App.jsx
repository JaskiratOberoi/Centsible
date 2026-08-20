import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StoreProvider } from './store.jsx'
import Dashboard from './components/Dashboard.jsx'
import AddExpense from './components/AddExpense.jsx'
import Analytics from './components/Analytics.jsx'
import Expenses from './components/Expenses.jsx'
import Wallet from './components/Wallet.jsx'

const TABS = [
  { id: 'home', label: 'Overview' },
  { id: 'add', label: 'Add' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'wallet', label: 'Wallet' },
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

export default function App() {
  const [tab, setTab] = useState(() => {
    const h = window.location.hash.slice(1)
    return TABS.some((t) => t.id === h) ? h : 'home'
  })

  useEffect(() => {
    window.history.replaceState(null, '', tab === 'home' ? '#' : `#${tab}`)
  }, [tab])

  return (
    <StoreProvider>
      <Aurora />
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <span className="coin-dot">¢</span>
            Cent<em>sible</em>
          </div>
          <nav className="nav">
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
    </StoreProvider>
  )
}
