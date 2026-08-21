import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store.jsx'
import { fmtMoney, isoDay, daysAgo, uid } from '../utils.js'
import { TiltCard } from './bits.jsx'

const CARD_COLORS = ['#1c5cab', '#199e70', '#c98500', '#7a4bd6', '#b0426e', '#3d6b75']

function Chip({ id }) {
  return (
    <svg className="pc-chip" viewBox="0 0 44 34" aria-hidden>
      <defs>
        <linearGradient id={`chip-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2e3b3" />
          <stop offset="45%" stopColor="#d9b969" />
          <stop offset="100%" stopColor="#a8842f" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="42" height="32" rx="7" fill={`url(#chip-${id})`} stroke="rgba(60,40,0,0.35)" />
      <path
        d="M1 12h12M1 22h12M31 12h12M31 22h12M22 1v8M22 25v8M13 12a9 9 0 0 1 18 0v10a9 9 0 0 1-18 0z"
        fill="none" stroke="rgba(60,40,0,0.4)" strokeWidth="1.4"
      />
    </svg>
  )
}

const Contactless = () => (
  <svg className="pc-glyph" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
    <path d="M6.5 8.6a6.5 6.5 0 0 1 0 6.8" />
    <path d="M10 6.5a10 10 0 0 1 0 11" />
    <path d="M13.5 4.4a13.8 13.8 0 0 1 0 15.2" />
  </svg>
)

const RupeeMark = () => (
  <span className="pc-glyph pc-rupee" aria-hidden>₹</span>
)

const KINDS = [
  { id: 'credit', label: 'Credit card' },
  { id: 'debit', label: 'Debit card' },
  { id: 'cash', label: 'Cash' },
  { id: 'wallet', label: 'UPI / wallet' },
]

export default function Wallet() {
  const { methods, expenses, monthlyBudget, dispatch, insights } = useStore()
  const [form, setForm] = useState({ label: '', kind: 'credit', last4: '', color: CARD_COLORS[3] })
  const [budgetDraft, setBudgetDraft] = useState(String(monthlyBudget))

  const spentByMethod = useMemo(() => {
    const since = isoDay(daysAgo(29))
    const map = {}
    for (const e of expenses.filter((x) => x.date >= since))
      map[e.methodId] = (map[e.methodId] || 0) + e.amount
    return map
  }, [expenses])

  function addMethod(e) {
    e.preventDefault()
    if (!form.label.trim()) return
    dispatch({
      type: 'add-method',
      method: {
        id: uid(),
        label: form.label.trim(),
        kind: form.kind,
        last4: form.last4 && /^\d{4}$/.test(form.last4) ? form.last4 : null,
        color: form.color,
      },
    })
    setForm({ label: '', kind: 'credit', last4: '', color: CARD_COLORS[(Math.random() * CARD_COLORS.length) | 0] })
  }

  return (
    <div className="grid" style={{ gap: 22 }}>
      <motion.div className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="section-title">Your wallet</div>
        <div className="section-sub">Payment methods, with what each carried in the last 30 days</div>
        <div className="cards-row">
          {methods.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20, rotate: -1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: i * 0.09, type: 'spring', stiffness: 160, damping: 20 }}
            >
              <TiltCard className={`pay-card kind-${m.kind}`} style={{ '--cc': m.color }}>
                <div className="pc-pattern" aria-hidden />
                <div className="shine" aria-hidden />
                <div className="pc-top">
                  <span className="pc-kind">{m.kind}</span>
                  {m.kind === 'credit' || m.kind === 'debit' ? <Contactless /> : <RupeeMark />}
                </div>
                {(m.kind === 'credit' || m.kind === 'debit') && <Chip id={m.id} />}
                <div className="pc-label">{m.label}</div>
                <div className="pc-bottom">
                  <div>
                    <div className="pc-number">{m.last4 ? `••••  ••••  ••••  ${m.last4}` : '— no number —'}</div>
                    <div className="pc-spent">{fmtMoney(spentByMethod[m.id] || 0)} · last 30 days</div>
                  </div>
                  <span className="pc-net" aria-hidden><i /><i /></span>
                  <button className="pc-del" onClick={() => dispatch({ type: 'delete-method', id: m.id })}>
                    remove
                  </button>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid two">
        <motion.div className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="section-title">Add a method</div>
          <div className="section-sub">Cards, cash, wallets — anything you pay with</div>
          <form className="form-grid" onSubmit={addMethod}>
            <div className="field">
              <label>Name</label>
              <input
                placeholder="e.g. Amex Gold" value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Type</label>
              <select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
                {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Last 4 digits (optional)</label>
              <input
                placeholder="1234" maxLength={4} inputMode="numeric" value={form.last4}
                onChange={(e) => setForm((f) => ({ ...f, last4: e.target.value.replace(/\D/g, '') }))}
              />
            </div>
            <div className="field">
              <label>Card color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', height: '100%' }}>
                {CARD_COLORS.map((c) => (
                  <button
                    key={c} type="button" aria-label={`color ${c}`}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', background: c,
                      border: form.color === c ? '2.5px solid var(--ink)' : '2.5px solid transparent',
                      transition: 'border 0.15s',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="span-2">
              <button className="btn small" type="submit">Add to wallet</button>
            </div>
          </form>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <div className="section-title">Monthly budget</div>
          <div className="section-sub">Penny paces the month against this number</div>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault()
              const v = parseFloat(budgetDraft)
              if (v > 0) dispatch({ type: 'set-budget', value: v })
            }}
          >
            <div className="field">
              <label>Budget (₹)</label>
              <input
                type="number" min="1" step="500" value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
              />
            </div>
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              <button className="btn small" type="submit">Update budget</button>
            </div>
            <div className="span-2" style={{ fontSize: 13.5, color: 'var(--ink-muted)' }}>
              You've used {Math.round(insights.budgetUsed * 100)}% of {fmtMoney(monthlyBudget)} this month.
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
