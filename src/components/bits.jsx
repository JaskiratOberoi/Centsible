import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion'
import { fmtMoney, categoryById, prettyDay } from '../utils.js'
import { useStore } from '../store.jsx'

export function CountUp({ value, format = fmtMoney }) {
  const ref = useRef(null)
  const mv = useMotionValue(0)
  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v)
      },
    })
    return controls.stop
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref}>{format(value)}</span>
}

export function TiltCard({ children, className, style }) {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const rx = useSpring(useTransform(y, [0, 1], [7, -7]), { stiffness: 160, damping: 18 })
  const ry = useSpring(useTransform(x, [0, 1], [-9, 9]), { stiffness: 160, damping: 18 })
  return (
    <motion.div
      className={className}
      style={{ ...style, rotateX: rx, rotateY: ry, perspective: 800 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - r.left) / r.width)
        y.set((e.clientY - r.top) / r.height)
      }}
      onPointerLeave={() => { x.set(0.5); y.set(0.5) }}
    >
      {children}
    </motion.div>
  )
}

export function TransactionList({ expenses, limit }) {
  const { methods, categories, dispatch } = useStore()
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date))
  const shown = limit ? sorted.slice(0, limit) : sorted
  const groups = []
  for (const e of shown) {
    const last = groups[groups.length - 1]
    if (last && last.date === e.date) last.items.push(e)
    else groups.push({ date: e.date, items: [e] })
  }
  if (!shown.length) return <div className="empty-note">Nothing here yet — log your first expense ✨</div>
  return (
    <div className="txn-list">
      {groups.map((g) => (
        <div key={g.date}>
          <div className="day-header">
            <span>{prettyDay(g.date)}</span>
            <span>{fmtMoney(g.items.reduce((a, e) => a + e.amount, 0))}</span>
          </div>
          {g.items.map((e, i) => {
            const cat = categoryById(categories, e.category)
            const method = methods.find((m) => m.id === e.methodId)
            return (
              <motion.div
                className="txn"
                key={e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35, ease: 'easeOut' }}
                layout
              >
                <div className="cat-chip" style={{ background: `${cat.color}26` }}>{cat.emoji}</div>
                <div className="txn-main">
                  <div className="txn-note">{e.note || cat.label}</div>
                  <div className="txn-meta">
                    {cat.label}
                    {method ? ` · ${method.label}${method.last4 ? ` ••${method.last4}` : ''}` : ''}
                  </div>
                </div>
                {e.scope === 'work' && (
                  <button
                    className={`scope-badge${e.reimbursed ? ' done' : ''}`}
                    title={e.reimbursed ? 'Reimbursed — click to undo' : 'Awaiting reimbursement — click when paid back'}
                    onClick={() => dispatch({ type: 'toggle-reimbursed', id: e.id })}
                  >
                    💼 {e.reimbursed ? 'reimbursed ✓' : 'work'}
                  </button>
                )}
                <div className="txn-amount">{fmtMoney(e.amount, { cents: true })}</div>
                <button
                  className="txn-del"
                  title="Delete"
                  onClick={() => dispatch({ type: 'delete-expense', id: e.id })}
                >
                  ✕
                </button>
              </motion.div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
