import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store.jsx'
import { fmtMoney, isoDay, daysAgo, exportExpensesCSV } from '../utils.js'
import { TransactionList, CountUp } from './bits.jsx'

const RANGES = [
  { id: 'month', label: 'This month' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
  { id: 'all', label: 'All time' },
]
const SCOPES = [
  { id: 'all', label: 'All' },
  { id: 'personal', label: '🏠 Personal' },
  { id: 'work', label: '💼 Work' },
]

export default function Expenses() {
  const { expenses, categories, methods } = useStore()
  const [scope, setScope] = useState('all')
  const [category, setCategory] = useState('all')
  const [range, setRange] = useState('month')
  const [pendingOnly, setPendingOnly] = useState(false)

  const filtered = useMemo(() => {
    let from = null
    if (range === 'month') from = isoDay().slice(0, 7) + '-01'
    else if (range !== 'all') from = isoDay(daysAgo(+range - 1))
    return expenses.filter((e) => {
      if (from && e.date < from) return false
      if (scope !== 'all' && (e.scope || 'personal') !== scope) return false
      if (category !== 'all' && e.category !== category) return false
      if (pendingOnly && !(e.scope === 'work' && !e.reimbursed)) return false
      return true
    })
  }, [expenses, scope, category, range, pendingOnly])

  const total = filtered.reduce((a, e) => a + e.amount, 0)
  const workPending = filtered
    .filter((e) => e.scope === 'work' && !e.reimbursed)
    .reduce((a, e) => a + e.amount, 0)

  function doExport() {
    const parts = ['centsible']
    if (scope !== 'all') parts.push(scope)
    if (category !== 'all') parts.push(category)
    parts.push(range === 'all' ? 'all-time' : range === 'month' ? isoDay().slice(0, 7) : `last-${range}-days`)
    const rows = [...filtered].sort((a, b) => a.date.localeCompare(b.date))
    exportExpensesCSV(rows, categories, methods, parts.join('-') + '.csv')
  }

  return (
    <div className="grid" style={{ gap: 22 }}>
      <motion.div className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="section-title">Explore expenses</div>
            <div className="section-sub">Filter by type, category & period — then take it to Excel</div>
          </div>
          <button className="btn small" onClick={doExport} disabled={!filtered.length}>
            ⬇︎ Export CSV ({filtered.length})
          </button>
        </div>

        <div className="filters">
          <div className="filter-group">
            {SCOPES.map((s) => (
              <button
                key={s.id} className={scope === s.id ? 'on' : ''}
                onClick={() => setScope(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <select className="filter-select" value={range} onChange={(e) => setRange(e.target.value)}>
            {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <label className="filter-check">
            <input
              type="checkbox" checked={pendingOnly}
              onChange={(e) => setPendingOnly(e.target.checked)}
            />
            awaiting reimbursement
          </label>
        </div>

        <div className="grid tiles" style={{ margin: '20px 0 6px' }}>
          <div>
            <div className="hero-figure" style={{ fontSize: 28 }}><CountUp value={total} /></div>
            <div className="stat-label">{filtered.length} expense{filtered.length === 1 ? '' : 's'} in view</div>
          </div>
          <div>
            <div className="hero-figure" style={{ fontSize: 28 }}><CountUp value={workPending} /></div>
            <div className="stat-label">💼 awaiting reimbursement (in view)</div>
          </div>
        </div>
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <TransactionList expenses={filtered} />
        {filtered.some((e) => e.scope === 'work') && (
          <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', paddingTop: 14 }}>
            Tip: click a 💼 badge to mark it reimbursed (or undo).
          </div>
        )}
      </motion.div>
    </div>
  )
}
