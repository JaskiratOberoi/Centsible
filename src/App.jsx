import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StoreProvider, useStore } from './store.jsx'
import { AuthProvider, useAuth } from './auth.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
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

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('centsible-theme') || 'dark')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('centsible-theme', theme)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0d0d0f' : '#f4f1ea')
  }, [theme])
  return [theme, setTheme]
}

function ThemeToggle({ theme, setTheme, floating }) {
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      className={`theme-toggle${floating ? ' floating' : ''}`}
      onClick={() => setTheme(next)}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
        </svg>
      )}
    </button>
  )
}

function SyncDot() {
  const { syncState } = useStore()
  if (syncState === 'local') return null
  const looks = {
    pulling: { color: 'var(--ink-muted)', label: 'Syncing from cloud…' },
    pushing: { color: 'var(--accent)', label: 'Saving to cloud…' },
    synced: { color: 'var(--good)', label: 'Synced across your devices' },
    error: { color: 'var(--bad)', label: 'Sync issue — changes saved on this device' },
  }[syncState]
  return <span className="sync-dot" style={{ background: looks.color }} title={looks.label} />
}

function Shell({ theme, setTheme }) {
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
        <ThemeToggle theme={theme} setTheme={setTheme} floating />
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
            <SyncDot />
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button className="user-logout" onClick={logout} title="Sign out" aria-label="Sign out">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 3v8" />
                <path d="M6.8 6.6a7.2 7.2 0 1 0 10.4 0" />
              </svg>
            </button>
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
  const [theme, setTheme] = useTheme()
  return (
    <AuthProvider>
      <Aurora />
      <Shell theme={theme} setTheme={setTheme} />
      <InstallPrompt />
    </AuthProvider>
  )
}
