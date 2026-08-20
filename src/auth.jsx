import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, isCloudConfigured } from './supabase-config.js'
import { uid } from './utils.js'

// Two auth modes behind one interface:
// - cloud (Supabase): real accounts that work across devices; data syncs via
//   the user_state table (see store.jsx).
// - local fallback (no Supabase config): users live in this browser's
//   localStorage with salted SHA-256 password hashes. Gates the UI on a
//   shared device, but is not server-side security.

export const supabase = isCloudConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

/* ————— local fallback ————— */

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

/* ————— provider ————— */

const AuthCtx = createContext(null)

const friendly = (err) => {
  const m = err?.message || String(err)
  if (/invalid login credentials/i.test(m)) return 'Email or password doesn’t match.'
  if (/already registered/i.test(m)) return 'An account with this email already exists — log in instead.'
  if (/at least 6/i.test(m) || /password should be/i.test(m)) return 'Password needs at least 6 characters.'
  if (/valid email/i.test(m) || /invalid format/i.test(m)) return 'That email doesn’t look right.'
  if (/rate limit/i.test(m)) return 'Too many attempts — give it a minute and try again.'
  if (/fetch|network/i.test(m)) return 'Can’t reach the server — check your connection.'
  if (/email not confirmed/i.test(m)) return 'Please confirm your email first — check your inbox.'
  return m
}

const mapCloudUser = (u) =>
  u ? { id: u.id, email: u.email, name: u.user_metadata?.name || u.email.split('@')[0] } : null

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setUser(mapCloudUser(data.session?.user))
        setReady(true)
      })
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(mapCloudUser(session?.user))
      })
      return () => sub.subscription.unsubscribe()
    }
    // local fallback
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
      cloud: !!supabase,

      async register(name, email, password) {
        name = name.trim()
        email = email.trim().toLowerCase()
        if (!name) throw new Error('Tell us your name!')
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('That email doesn’t look right.')
        if (password.length < 6) throw new Error('Password needs at least 6 characters.')

        if (supabase) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
          })
          if (error) throw new Error(friendly(error))
          // when email confirmation is enabled, there is no session yet
          if (!data.session) return { needsConfirmation: true }
          return {}
        }

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
        return {}
      },

      async login(email, password) {
        email = email.trim().toLowerCase()

        if (supabase) {
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw new Error(friendly(error))
          return
        }

        const u = readUsers().find((x) => x.email === email)
        if (!u || (await hashPassword(u.salt, password)) !== u.passHash)
          throw new Error('Email or password doesn’t match.')
        localStorage.setItem(SESSION_KEY, u.id)
        setUser(u)
      },

      async logout() {
        if (supabase) {
          await supabase.auth.signOut()
          return
        }
        localStorage.removeItem(SESSION_KEY)
        setUser(null)
      },
    }),
    [user, ready]
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
