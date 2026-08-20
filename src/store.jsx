import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { isoDay, daysAgo, uid, computeInsights, DEFAULT_CATEGORIES } from './utils.js'
import { supabase } from './auth.jsx'

const LEGACY_KEY = 'centsible-v2' // pre-accounts store; adopted by the first user
const keyFor = (userId) => `centsible-v2:${userId}`

const DEFAULT_METHODS = [
  { id: 'card-sapphire', label: 'Sapphire Visa', kind: 'credit', last4: '4421', color: '#1c5cab' },
  { id: 'card-everyday', label: 'Everyday Debit', kind: 'debit', last4: '8837', color: '#199e70' },
  { id: 'upi', label: 'UPI', kind: 'wallet', last4: null, color: '#7a4bd6' },
  { id: 'cash', label: 'Cash', kind: 'cash', last4: null, color: '#c98500' },
]

function seedExpenses() {
  // A believable ~45 days of sample life, so charts breathe on first open.
  const picks = [
    ['food', 'Swiggy dinner', 380], ['food', 'Filter coffee', 120], ['food', 'Lunch thali', 250],
    ['food', 'Momos with friends', 480], ['groceries', 'Weekly groceries', 1650],
    ['groceries', 'Sabzi mandi run', 420], ['transport', 'Uber home', 340],
    ['transport', 'Metro top-up', 200], ['transport', 'Petrol fill-up', 1100],
    ['shopping', 'New sneakers', 2600], ['shopping', 'Desk lamp', 900],
    ['entertainment', 'Movie tickets', 600], ['entertainment', 'Concert tee', 800],
    ['entertainment', 'OTT bundle', 450], ['bills', 'Electricity', 1600],
    ['bills', 'Broadband', 999], ['bills', 'Phone plan', 599],
    ['health', 'Pharmacy run', 350], ['health', 'Yoga drop-in', 400],
    ['other', 'Birthday gift', 850],
  ]
  const methods = ['card-sapphire', 'card-everyday', 'upi', 'cash']
  const out = []
  let s = 7
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 45; i >= 0; i--) {
    const n = rand() < 0.22 ? 0 : 1 + Math.floor(rand() * 2.4)
    for (let k = 0; k < n; k++) {
      const [category, note, base] = picks[Math.floor(rand() * picks.length)]
      const work = rand() < 0.16
      out.push({
        id: uid() + i + '' + k,
        date: isoDay(daysAgo(i)),
        amount: Math.round(base * (0.75 + rand() * 0.55)),
        category,
        note: work ? `${note} (client visit)` : note,
        methodId: methods[Math.floor(rand() * methods.length)],
        scope: work ? 'work' : 'personal',
        reimbursed: work ? rand() < 0.4 : undefined,
        sample: true,
      })
    }
  }
  return out
}

function initialState(key) {
  try {
    // adopt data saved before accounts existed, so nothing is lost on upgrade
    const raw = localStorage.getItem(key) ?? localStorage.getItem(LEGACY_KEY)
    if (raw) {
      localStorage.removeItem(LEGACY_KEY)
      const s = JSON.parse(raw)
      // older saves may predate custom categories
      if (!s.categories) s.categories = DEFAULT_CATEGORIES
      return s
    }
  } catch { /* fall through to fresh state */ }
  return {
    expenses: seedExpenses(),
    methods: DEFAULT_METHODS,
    categories: DEFAULT_CATEGORIES,
    monthlyBudget: 50000,
    seeded: true,
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return { ...action.state, categories: action.state.categories || DEFAULT_CATEGORIES }
    case 'add-expense':
      return { ...state, expenses: [action.expense, ...state.expenses] }
    case 'delete-expense':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) }
    case 'toggle-reimbursed':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.id ? { ...e, reimbursed: !e.reimbursed } : e
        ),
      }
    case 'clear-samples':
      return { ...state, seeded: false, expenses: state.expenses.filter((e) => !e.sample) }
    case 'add-method':
      return { ...state, methods: [...state.methods, action.method] }
    case 'delete-method':
      return { ...state, methods: state.methods.filter((m) => m.id !== action.id) }
    case 'add-category':
      return { ...state, categories: [...state.categories, action.category] }
    case 'set-budget':
      return { ...state, monthlyBudget: action.value }
    default:
      return state
  }
}

const StoreCtx = createContext(null)

export function StoreProvider({ userId, children }) {
  // remounted per user (key={userId} at the call site), so lazy init is safe
  const [state, dispatch] = useReducer(reducer, keyFor(userId), initialState)
  const [syncState, setSyncState] = useState(supabase ? 'pulling' : 'local')
  const hydrated = useRef(!supabase) // block pushes until the cloud copy is pulled
  const pushTimer = useRef(null)

  // initial pull: cloud copy wins; if none exists, adopt this device's state
  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    supabase
      .from('user_state')
      .select('state')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data?.state) dispatch({ type: 'hydrate', state: data.state })
        hydrated.current = true
        setSyncState(error ? 'error' : 'synced')
      })
    return () => { cancelled = true }
  }, [userId])

  useEffect(() => {
    localStorage.setItem(keyFor(userId), JSON.stringify(state))
    if (!supabase || !hydrated.current) return
    setSyncState('pushing')
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from('user_state')
        .upsert({ user_id: userId, state, updated_at: new Date().toISOString() })
      setSyncState(error ? 'error' : 'synced')
    }, 800)
    return () => clearTimeout(pushTimer.current)
  }, [state, userId])

  const insights = useMemo(
    () => computeInsights(state.expenses, state.monthlyBudget),
    [state.expenses, state.monthlyBudget]
  )

  const value = useMemo(() => ({ ...state, insights, syncState, dispatch }), [state, insights, syncState])
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export const useStore = () => useContext(StoreCtx)
