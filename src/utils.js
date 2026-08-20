export const DEFAULT_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', emoji: '🍜', color: '#d95926' },
  { id: 'groceries', label: 'Groceries', emoji: '🥑', color: '#199e70' },
  { id: 'transport', label: 'Transport', emoji: '🚕', color: '#3987e5' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#d55181' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬', color: '#9085e9' },
  { id: 'bills', label: 'Bills & Utilities', emoji: '💡', color: '#c98500' },
  { id: 'health', label: 'Health', emoji: '💊', color: '#e66767' },
  { id: 'other', label: 'Other', emoji: '✨', color: '#898781' },
]

// palette slots handed to user-created categories, in order
export const CATEGORY_COLORS = ['#008300', '#1c5cab', '#b0426e', '#7a4bd6', '#3d6b75', '#a8842f']

export const categoryById = (categories, id) =>
  categories.find((c) => c.id === id) ||
  categories.find((c) => c.id === 'other') ||
  categories[categories.length - 1]

export const fmtMoney = (n, opts = {}) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: opts.cents && n % 1 !== 0 ? 2 : 0,
    ...opts,
  }).format(n)

export const isoDay = (d = new Date()) => {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
    dt.getDate()
  ).padStart(2, '0')}`
}

export const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

export const prettyDay = (iso) => {
  const today = isoDay()
  const yesterday = isoDay(daysAgo(1))
  if (iso === today) return 'Today'
  if (iso === yesterday) return 'Yesterday'
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export const shortDay = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })

const sum = (arr) => arr.reduce((a, e) => a + e.amount, 0)

export function computeInsights(expenses, monthlyBudget) {
  const today = new Date()
  const monthKey = isoDay(today).slice(0, 7)
  const thisMonth = expenses.filter((e) => e.date.startsWith(monthKey))
  const monthTotal = sum(thisMonth)

  const last7 = expenses.filter((e) => e.date >= isoDay(daysAgo(6)))
  const prev7 = expenses.filter(
    (e) => e.date >= isoDay(daysAgo(13)) && e.date < isoDay(daysAgo(6))
  )
  const weekTotal = sum(last7)
  const prevWeekTotal = sum(prev7)
  const weekDelta = prevWeekTotal > 0 ? (weekTotal - prevWeekTotal) / prevWeekTotal : null

  const dayOfMonth = today.getDate()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const dailyPace = dayOfMonth > 0 ? monthTotal / dayOfMonth : 0
  const projected = dailyPace * daysInMonth

  const byCategory = {}
  for (const e of thisMonth) byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
  const topCategoryId = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const todayTotal = sum(expenses.filter((e) => e.date === isoDay()))
  const budgetUsed = monthlyBudget > 0 ? monthTotal / monthlyBudget : 0

  const pendingReimbursement = sum(
    expenses.filter((e) => e.scope === 'work' && !e.reimbursed)
  )

  // mood drives the mascot: thriving | steady | worried
  let mood = 'steady'
  if (budgetUsed < 0.55 * (dayOfMonth / daysInMonth) + 0.15) mood = 'thriving'
  if (projected > monthlyBudget * 1.05 || budgetUsed > 1) mood = 'worried'

  return {
    monthTotal,
    weekTotal,
    prevWeekTotal,
    weekDelta,
    projected,
    dailyPace,
    topCategoryId,
    topCategoryAmount: topCategoryId ? byCategory[topCategoryId] : 0,
    byCategory,
    todayTotal,
    budgetUsed,
    pendingReimbursement,
    mood,
    daysInMonth,
    dayOfMonth,
  }
}

export function dailySeries(expenses, days = 30) {
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const iso = isoDay(daysAgo(i))
    out.push({
      date: iso,
      label: shortDay(iso),
      total: +sum(expenses.filter((e) => e.date === iso)).toFixed(2),
    })
  }
  return out
}

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export function exportExpensesCSV(expenses, categories, methods, filename) {
  const esc = (v) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = ['Date', 'Note', 'Category', 'Type', 'Reimbursed', 'Payment method', 'Amount (INR)']
  const rows = expenses.map((e) => {
    const cat = categoryById(categories, e.category)
    const method = methods.find((m) => m.id === e.methodId)
    return [
      e.date,
      e.note || '',
      cat.label,
      e.scope === 'work' ? 'Work' : 'Personal',
      e.scope === 'work' ? (e.reimbursed ? 'Yes' : 'No') : '—',
      method ? `${method.label}${method.last4 ? ` (••${method.last4})` : ''}` : '',
      e.amount.toFixed(2),
    ]
  })
  // ﻿ BOM so Excel opens it as UTF-8 (keeps ₹ and emoji intact)
  const csv = '﻿' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
