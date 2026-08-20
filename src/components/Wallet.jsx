import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store.jsx'
import { fmtMoney, isoDay, daysAgo, uid } from '../utils.js'
import { TiltCard } from './bits.jsx'

const CARD_COLORS = ['#1c5cab', '#199e70', '#c98500', '#7a4bd6', '#b0426e', '#3d6b75']
const KINDS = [
  { id: 'credit', label: 'Credit card' },
  { id: 'debit', label: 'Debit card' },
  { id: 'cash', label: 'Cash' },
  { id: 'wallet', label: 'Digital wallet' },
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
              <TiltCard
                className="pay-card"
                style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}88), var(--surface-2)` }}
              >
                <div className="shine" />
                <div>
                  <div className="pc-kind">{m.kind}</div>
                  <div className="pc-label">{m.label}</div>
                </div>
                <div className="pc-bottom">
                  <div>
                    <div className="pc-number">{m.last4 ? `••••  ••••  ••••  ${m.last4}` : '— no number —'}</div>
                    <div className="pc-spent">{fmtMoney(spentByMethod[m.id] || 0)} · last 30 days</div>
                  </div>
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
              <label>Budget (USD)</label>
              <input
                type="number" min="1" step="50" value={budgetDraft}
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
