import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../auth.jsx'
import { Penny } from './Mascot.jsx'

export default function AuthScreen() {
  const { login, register, cloud } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        const res = await register(form.name, form.email, form.password)
        if (res?.needsConfirmation) {
          setMode('login')
          setNotice('Almost there — confirm your email from your inbox, then log in here.')
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <motion.div
        className="auth-card card"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-mascot">
          <Penny mood="thriving" size={110} />
        </div>
        <div className="brand auth-brand">
          <span className="coin-dot">¢</span>
          Cent<em>sible</em>
        </div>
        <p className="auth-sub">
          {mode === 'login' ? 'Welcome back — Penny missed you.' : 'Meet Penny, your money’s new best friend.'}
        </p>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setError(null) }}>
            Log in
            {mode === 'login' && <motion.span className="auth-tab-line" layoutId="auth-tab" />}
          </button>
          <button className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setError(null) }}>
            Create account
            {mode === 'register' && <motion.span className="auth-tab-line" layoutId="auth-tab" />}
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          <AnimatePresence initial={false}>
            {mode === 'register' && (
              <motion.div
                className="field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label>Name</label>
                <input placeholder="What should Penny call you?" value={form.name} onChange={set('name')} autoComplete="name" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="field">
            <label>Email</label>
            <input
              type="email" placeholder="you@example.com" required
              value={form.email} onChange={set('email')} autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <div className="pass-wrap">
              <input
                type={showPass ? 'text' : 'password'} placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                required value={form.password} onChange={set('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button type="button" className="pass-eye" onClick={() => setShowPass((s) => !s)} aria-label="Toggle password visibility">
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {notice && (
              <motion.div
                className="auth-notice"
                key="notice"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                📮 {notice}
              </motion.div>
            )}
            {error && (
              <motion.div
                className="auth-error"
                key={error}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0, x: [0, -7, 7, -4, 4, 0] }}
                exit={{ opacity: 0 }}
                transition={{ x: { duration: 0.4 } }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button className="btn" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? '…' : mode === 'login' ? 'Log in' : 'Create my account'}
          </button>
        </form>

        <p className="auth-fine">
          {cloud
            ? 'Your account syncs securely across devices — log in anywhere to pick up where you left off.'
            : 'Your account and data live on this device only — nothing is sent to a server.'}
        </p>
      </motion.div>
    </div>
  )
}
