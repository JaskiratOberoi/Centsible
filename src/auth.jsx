import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { uid } from './utils.js'

// Local-first accounts: users live in this browser's localStorage, passwords
// stored as salted SHA-256 hashes. This gates the UI and separates each
// user's data on a shared device — it is not server-side security.

const USERS_KEY = 'centsible-users'
const SESSION_KEY = 'centsible-session'

const readUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || []
  } catch {
    return []
  }
}

async function hashPassword(salt, password) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sessionId = localStorage.getItem(SESSION_KEY)
    if (sessionId) {
      const u = readUsers().find((x) => x.id === sessionId)
      if (u) setUser(u)
      else localStorage.removeItem(SESSION_KEY)
    }
    setReady(true)
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,

      async register(name, email, password) {
        name = name.trim()
        email = email.trim().toLowerCase()
        if (!name) throw new Error('Tell us your name!')
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('That email doesn’t look right.')
        if (password.length < 6) throw new Error('Password needs at least 6 characters.')
        const users = readUsers()
        if (users.some((u) => u.email === email)) throw new Error('An account with this email already exists — log in instead.')
        const salt = uid() + uid()
        const u = {
          id: uid(),
          name,
          email,
          salt,
          passHash: await hashPassword(salt, password),
          createdAt: new Date().toISOString(),
        }
        localStorage.setItem(USERS_KEY, JSON.stringify([...users, u]))
        localStorage.setItem(SESSION_KEY, u.id)
        setUser(u)
      },

      async login(email, password) {
        email = email.trim().toLowerCase()
        const u = readUsers().find((x) => x.email === email)
        if (!u || (await hashPassword(u.salt, password)) !== u.passHash)
          throw new Error('Email or password doesn’t match.')
        localStorage.setItem(SESSION_KEY, u.id)
        setUser(u)
      },

      logout() {
        localStorage.removeItem(SESSION_KEY)
        setUser(null)
      },
    }),
    [user, ready]
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
