import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { useStore } from '../store.jsx'
import { fmtMoney, categoryById, dailySeries, isoDay, daysAgo } from '../utils.js'

function VizTooltip({ active, payload, label, money = true }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="viz-tooltip">
      <div className="tt-label">{p.payload.tooltipLabel || label}</div>
      <div className="tt-value">{money ? fmtMoney(p.value, { cents: true }) : p.value}</div>
    </div>
  )
}

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } }

export default function Analytics() {
  const { expenses, insights, monthlyBudget, methods, categories } = useStore()

  const trend = useMemo(() => dailySeries(expenses, 30), [expenses])

  const catData = useMemo(() => {
    const monthKey = isoDay().slice(0, 7)
    const map = {}
    for (const e of expenses.filter((x) => x.date.startsWith(monthKey)))
      map[e.category] = (map[e.category] || 0) + e.amount
    return Object.entries(map)
      .map(([id, value]) => ({ ...categoryById(categories, id), id, value: +value.toFixed(2) }))
      .sort((a, b) => b.value - a.value)
  }, [expenses, categories])

  const byMethod = useMemo(() => {
    const since = isoDay(daysAgo(29))
    const map = {}
    for (const e of expenses.filter((x) => x.date >= since))
      map[e.methodId] = (map[e.methodId] || 0) + e.amount
    return methods
      .map((m) => ({ name: m.label, tooltipLabel: m.label, value: +(map[m.id] || 0).toFixed(2), color: m.color }))
      .sort((a, b) => b.value - a.value)
  }, [expenses, methods])

  const topCat = insights.topCategoryId ? categoryById(categories, insights.topCategoryId) : null
  const catTotal = catData.reduce((a, c) => a + c.value, 0)

  const smartInsights = useMemo(() => {
    const out = []
    if (insights.projected > 0)
      out.push({
        ic: insights.projected > monthlyBudget ? '🔮' : '🧘',
        text: (
          <>At your current pace (<b>{fmtMoney(insights.dailyPace, { cents: true })}/day</b>) you'll end the month around <b>{fmtMoney(insights.projected)}</b> — {insights.projected > monthlyBudget ? <>about <b>{fmtMoney(insights.projected - monthlyBudget)}</b> over budget. Trimming ~{fmtMoney(Math.ceil((insights.projected - monthlyBudget) / Math.max(insights.daysInMonth - insights.dayOfMonth, 1)))} a day gets you back on track.</> : <>comfortably inside your <b>{fmtMoney(monthlyBudget)}</b> budget.</>}</>
        ),
      })
    if (topCat && catTotal > 0)
      out.push({
        ic: topCat.emoji,
        text: (
          <><b>{topCat.label}</b> is your biggest line this month at <b>{fmtMoney(insights.topCategoryAmount)}</b> — {Math.round((insights.topCategoryAmount / catTotal) * 100)}% of everything you've spent.</>
        ),
      })
    if (insights.weekDelta != null)
      out.push({
        ic: insights.weekDelta > 0 ? '📈' : '📉',
        text: (
          <>This week you spent <b>{fmtMoney(insights.weekTotal)}</b>, {insights.weekDelta > 0 ? 'up' : 'down'} <b>{Math.abs(Math.round(insights.weekDelta * 100))}%</b> from last week's {fmtMoney(insights.prevWeekTotal)}.</>
        ),
      })
    const noSpend = trend.filter((d) => d.total === 0).length
    if (noSpend > 0)
      out.push({
        ic: '🌿',
        text: (<>You had <b>{noSpend} no-spend {noSpend === 1 ? 'day' : 'days'}</b> in the last 30 — every one keeps Penny smiling.</>),
      })
    return out
  }, [insights, monthlyBudget, topCat, catTotal, trend])

  return (
    <div className="grid" style={{ gap: 22 }}>
      <motion.div className="card chart-card" {...fadeUp}>
        <div className="section-title">Last 30 days</div>
        <div className="section-sub">Daily spending — hover for exact figures</div>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={trend} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8c168" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#e8c168" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--grid)" strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="label" tick={{ fill: 'var(--ink-muted)', fontSize: 11.5 }}
              tickLine={false} axisLine={{ stroke: 'var(--grid)' }} interval={6}
            />
            <YAxis
              tick={{ fill: 'var(--ink-muted)', fontSize: 11.5 }} tickLine={false}
              axisLine={false} width={44} tickFormatter={(v) => fmtMoney(v)}
            />
            <Tooltip content={<VizTooltip />} cursor={{ stroke: 'var(--ink-muted)', strokeWidth: 1 }} />
            <Area
              type="monotone" dataKey="total" stroke="#e8c168" strokeWidth={2}
              fill="url(#trendFill)" activeDot={{ r: 4.5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid two">
        <motion.div className="card chart-card" {...fadeUp} transition={{ delay: 0.08 }}>
          <div className="section-title">Where it went</div>
          <div className="section-sub">This month, by category</div>
          {catData.length ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Tooltip content={<VizTooltip />} />
                  <Pie
                    data={catData.map((c) => ({ ...c, tooltipLabel: c.label }))}
                    dataKey="value" nameKey="label"
                    innerRadius={62} outerRadius={92} paddingAngle={2.5}
                    stroke="var(--surface)" strokeWidth={2}
                  >
                    {catData.map((c) => (
                      <Cell key={c.id} fill={c.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="legend-row">
                {catData.map((c) => (
                  <div className="legend-item" key={c.id}>
                    <span className="dot" style={{ background: c.color }} />
                    {c.label} <b>{fmtMoney(c.value)}</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-note">No spending this month yet 🎈</div>
          )}
        </motion.div>

        <motion.div className="card chart-card" {...fadeUp} transition={{ delay: 0.14 }}>
          <div className="section-title">How you paid</div>
          <div className="section-sub">Last 30 days, by payment method</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byMethod} layout="vertical" margin={{ top: 4, right: 18, left: 8, bottom: 0 }}>
              <CartesianGrid stroke="var(--grid)" horizontal={false} />
              <XAxis
                type="number" tick={{ fill: 'var(--ink-muted)', fontSize: 11.5 }}
                tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoney(v)}
              />
              <YAxis
                type="category" dataKey="name" width={120}
                tick={{ fill: 'var(--ink-2)', fontSize: 12.5 }} tickLine={false}
                axisLine={{ stroke: 'var(--grid)' }}
              />
              <Tooltip content={<VizTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" barSize={18} radius={[0, 4, 4, 0]}>
                {byMethod.map((m) => (
                  <Cell key={m.name} fill={m.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div className="card" {...fadeUp} transition={{ delay: 0.2 }}>
        <div className="section-title">Penny's read on things</div>
        <div className="section-sub">Smart takeaways from your recent spending</div>
        <div className="grid tiles">
          {smartInsights.map((ins, i) => (
            <motion.div
              className="insight" key={i}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08 }}
            >
              <div className="ic">{ins.ic}</div>
              <div className="it">{ins.text}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
