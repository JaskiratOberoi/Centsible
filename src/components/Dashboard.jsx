import { motion } from 'framer-motion'
import { useStore } from '../store.jsx'
import { fmtMoney, categoryById } from '../utils.js'
import { MascotStage } from './Mascot.jsx'
import { CountUp, TransactionList } from './bits.jsx'

function BudgetRing({ used, budget }) {
  const pct = Math.min(used, 1)
  const R = 52
  const C = 2 * Math.PI * R
  const over = used > 1
  return (
    <div className="ring-wrap">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={R} fill="none" stroke="var(--grid)" strokeWidth="10" />
        <motion.circle
          cx="65" cy="65" r={R} fill="none"
          stroke={over ? 'var(--bad)' : 'url(#ringGrad)'}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          transform="rotate(-90 65 65)"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-2)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <text x="65" y="61" textAnchor="middle" fill="var(--ink)" fontSize="22" fontWeight="700" fontFamily="var(--font-ui)">
          {Math.round(used * 100)}%
        </text>
        <text x="65" y="79" textAnchor="middle" fill="var(--ink-muted)" fontSize="10.5" fontFamily="var(--font-ui)">
          of budget
        </text>
      </svg>
      <div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          <b style={{ color: 'var(--ink)' }}>{fmtMoney(budget)}</b> monthly budget
          <br />
          {over ? (
            <span style={{ color: 'var(--bad)', fontWeight: 600 }}>over by {fmtMoney(used * budget - budget)}</span>
          ) : (
            <span>{fmtMoney(budget * (1 - used))} to go</span>
          )}
        </div>
      </div>
    </div>
  )
}

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
}

export default function Dashboard({ goTo }) {
  const { expenses, insights, monthlyBudget, seeded, dispatch } = useStore()
  const topCat = insights.topCategoryId ? categoryById(insights.topCategoryId) : null
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' })

  return (
    <div className="grid" style={{ gap: 22 }}>
      <div className="grid hero">
        <motion.div className="card" {...fadeUp} transition={{ duration: 0.5 }}>
          <div className="eyebrow">{monthName} so far</div>
          <h1 className="display" style={{ margin: '10px 0 18px' }}>
            You've spent <em><CountUp value={insights.monthTotal} /></em>
          </h1>
          <BudgetRing used={insights.budgetUsed} budget={monthlyBudget} />
          <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
            <button className="btn small" onClick={() => goTo('add')}>+ Log an expense</button>
            <button className="btn small ghost" onClick={() => goTo('analytics')}>See analytics</button>
          </div>
        </motion.div>

        <motion.div
          className="card"
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}
        >
          <MascotStage insights={insights} budget={monthlyBudget} />
          <div className="grid tiles" style={{ marginTop: 16 }}>
            <div>
              <div className="hero-figure" style={{ fontSize: 26 }}>
                <CountUp value={insights.todayTotal} />
              </div>
              <div className="stat-label">spent today</div>
            </div>
            <div>
              <div className="hero-figure" style={{ fontSize: 26 }}>
                <CountUp value={insights.weekTotal} />
              </div>
              <div className="stat-label">
                last 7 days{' '}
                {insights.weekDelta != null && (
                  <span className={`delta ${insights.weekDelta > 0 ? 'up' : 'down'}`}>
                    {insights.weekDelta > 0 ? '▲' : '▼'} {Math.abs(Math.round(insights.weekDelta * 100))}%
                  </span>
                )}
              </div>
            </div>
            {topCat && (
              <div>
                <div className="hero-figure" style={{ fontSize: 26 }}>{topCat.emoji}</div>
                <div className="stat-label">top: {topCat.label.toLowerCase()}</div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div className="card" {...fadeUp} transition={{ duration: 0.5, delay: 0.18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div className="section-title">Recent activity</div>
            <div className="section-sub">Your latest transactions, freshest first</div>
          </div>
          {seeded && (
            <button className="linklike" onClick={() => dispatch({ type: 'clear-samples' })}>
              clear sample data
            </button>
          )}
        </div>
        <TransactionList expenses={expenses} limit={12} />
      </motion.div>
    </div>
  )
}
