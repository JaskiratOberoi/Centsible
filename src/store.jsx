import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { isoDay, daysAgo, uid, computeInsights } from './utils.js'

const KEY = 'centsible-v1'

const DEFAULT_METHODS = [
  { id: 'card-sapphire', label: 'Sapphire Visa', kind: 'credit', last4: '4421', color: '#1c5cab' },
  { id: 'card-everyday', label: 'Everyday Debit', kind: 'debit', last4: '8837', color: '#199e70' },
  { id: 'cash', label: 'Cash', kind: 'cash', last4: null, color: '#c98500' },
]

function seedExpenses() {
  // A believable ~45 days of sample life, so charts breathe on first open.
  const picks = [
    ['food', 'Ramen night', 18.5], ['food', 'Coffee', 5.25], ['food', 'Lunch bowl', 13.9],
    ['food', 'Tacos with friends', 32.4], ['groceries', 'Weekly groceries', 82.13],
    ['groceries', 'Farmers market', 24.5], ['transport', 'Uber home', 16.75],
    ['transport', 'Metro pass', 12.0], ['transport', 'Gas fill-up', 44.2],
    ['shopping', 'New sneakers', 96.0], ['shopping', 'Desk lamp', 38.99],
    ['entertainment', 'Movie tickets', 28.0], ['entertainment', 'Concert tee', 35.0],
    ['entertainment', 'Streaming bundle', 21.99], ['bills', 'Electricity', 74.6],
    ['bills', 'Internet', 59.99], ['bills', 'Phone plan', 45.0],
    ['health', 'Pharmacy run', 22.35], ['health', 'Yoga drop-in', 18.0],
    ['other', 'Birthday gift', 40.0],
  ]
  const methods = ['card-sapphire', 'card-everyday', 'cash']
  const out = []
  let s = 7
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 45; i >= 0; i--) {
    const n = rand() < 0.22 ? 0 : 1 + Math.floor(rand() * 2.4)
    for (let k = 0; k < n; k++) {
      const [category, note, base] = picks[Math.floor(rand() * picks.length)]
      out.push({
        id: uid() + i + '' + k,
        date: isoDay(daysAgo(i)),
        amount: +(base * (0.75 + rand() * 0.55)).toFixed(2),
        category,
        note,
        methodId: methods[Math.floor(rand() * methods.length)],
        sample: true,
      })
    }
  }
  return out
}

function initialState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* fall through to fresh state */ }
  return {
    expenses: seedExpenses(),
    methods: DEFAULT_METHODS,
    monthlyBudget: 2200,
    seeded: true,
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'add-expense':
      return { ...state, expenses: [action.expense, ...state.expenses] }
    case 'delete-expense':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) }
    case 'clear-samples':
      return { ...state, seeded: false, expenses: state.expenses.filter((e) => !e.sample) }
    case 'add-method':
      return { ...state, methods: [...state.methods, action.method] }
    case 'delete-method':
      return { ...state, methods: state.methods.filter((m) => m.id !== action.id) }
    case 'set-budget':
      return { ...state, monthlyBudget: action.value }
    default:
      return state
  }
}

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  const insights = useMemo(
    () => computeInsights(state.expenses, state.monthlyBudget),
    [state.expenses, state.monthlyBudget]
  )

  const value = useMemo(() => ({ ...state, insights, dispatch }), [state, insights])
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export const useStore = () => useContext(StoreCtx)
