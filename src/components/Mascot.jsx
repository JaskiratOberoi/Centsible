import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { fmtMoney, categoryById } from '../utils.js'

// Penny — a lively little coin who reacts to how the month is going.
const MOODS = {
  thriving: { blush: 0.9, browTilt: -4, mouth: 'M 38 62 Q 50 74 62 62', bounce: 7 },
  steady: { blush: 0.5, browTilt: 0, mouth: 'M 40 64 Q 50 70 60 64', bounce: 5 },
  worried: { blush: 0.2, browTilt: 9, mouth: 'M 40 68 Q 50 61 60 68', bounce: 3 },
}

export function Penny({ mood = 'steady', size = 150 }) {
  const m = MOODS[mood] || MOODS.steady
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    let alive = true
    let t
    const loop = () => {
      t = setTimeout(() => {
        if (!alive) return
        setBlink(true)
        setTimeout(() => alive && setBlink(false), 130)
        loop()
      }, 2200 + Math.random() * 2600)
    }
    loop()
    return () => { alive = false; clearTimeout(t) }
  }, [])

  return (
    <motion.div
      style={{ width: size, height: size, flex: 'none' }}
      animate={{ y: [0, -m.bounce, 0], rotate: mood === 'thriving' ? [0, 2, -2, 0] : 0 }}
      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-label={`Penny the coin, feeling ${mood}`}>
        <defs>
          <radialGradient id="coinG" cx="35%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#f6e7b8" />
            <stop offset="55%" stopColor="#e8c168" />
            <stop offset="100%" stopColor="#b08a33" />
          </radialGradient>
        </defs>
        {/* soft shadow */}
        <motion.ellipse
          cx="50" cy="95" rx="26" ry="4.5" fill="rgba(0,0,0,0.35)"
          style={{ transformOrigin: '50px 95px' }}
          animate={{ scaleX: [1, 0.85, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle cx="50" cy="48" r="42" fill="url(#coinG)" />
        <circle cx="50" cy="48" r="35" fill="none" stroke="rgba(122,90,26,0.55)" strokeWidth="1.6" strokeDasharray="3.2 4.2" />
        {/* sparkle */}
        <motion.path
          d="M 76 18 l 2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2 z"
          fill="#fff8e2"
          animate={{ opacity: [0, 1, 0], scale: [0.7, 1.15, 0.7] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '78px 25px' }}
        />
        {/* brows */}
        <g stroke="#5b430f" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d={`M 30 ${34 + m.browTilt * 0.3} q 6 ${-4 - m.browTilt * 0.4} 12 ${m.browTilt * 0.5}`} />
          <path d={`M 58 ${34 + m.browTilt * 0.8} q 6 ${-4 + m.browTilt * 0.4} 12 ${-m.browTilt * 0.5}`} />
        </g>
        {/* eyes */}
        {blink ? (
          <g stroke="#3d2c05" strokeWidth="2.8" strokeLinecap="round">
            <line x1="32" y1="48" x2="42" y2="48" />
            <line x1="58" y1="48" x2="68" y2="48" />
          </g>
        ) : (
          <g>
            <circle cx="37" cy="48" r="5.4" fill="#3d2c05" />
            <circle cx="63" cy="48" r="5.4" fill="#3d2c05" />
            <circle cx="38.8" cy="46" r="1.8" fill="#fff" />
            <circle cx="64.8" cy="46" r="1.8" fill="#fff" />
          </g>
        )}
        {/* blush */}
        <g fill="#e07a4f" opacity={m.blush * 0.55}>
          <ellipse cx="28" cy="58" rx="5.5" ry="3.2" />
          <ellipse cx="72" cy="58" rx="5.5" ry="3.2" />
        </g>
        {/* mouth */}
        <path d={m.mouth} fill="none" stroke="#3d2c05" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    </motion.div>
  )
}

export function MascotStage({ insights, budget }) {
  const line = useMemo(() => {
    const { mood, projected, weekDelta, topCategoryId, monthTotal } = insights
    const remaining = budget - monthTotal
    if (mood === 'worried')
      return (
        <>You're pacing toward <b>{fmtMoney(projected)}</b> this month — a touch over your <b>{fmtMoney(budget)}</b> budget. Maybe a cozy night in? 🌙</>
      )
    if (mood === 'thriving')
      return (
        <>Look at you! <b>{fmtMoney(Math.max(remaining, 0))}</b> still in the pot and the month is {insights.dayOfMonth >= insights.daysInMonth - 2 ? 'almost done' : 'humming along'}. Treat yourself (centsibly). ✨</>
      )
    if (weekDelta != null && Math.abs(weekDelta) > 0.12)
      return weekDelta > 0 ? (
        <>Spending is up <b>{Math.round(weekDelta * 100)}%</b> vs last week — mostly <b>{categoryById(topCategoryId).label.toLowerCase()}</b>. Keeping an eye on it 👀</>
      ) : (
        <>Nice — you spent <b>{Math.round(-weekDelta * 100)}%</b> less than last week. I love this for us.</>
      )
    return (
      <>Steady as she goes — <b>{fmtMoney(remaining > 0 ? remaining : 0)}</b> left for the month. I'll holler if anything looks odd.</>
    )
  }, [insights, budget])

  return (
    <div className="mascot-stage">
      <Penny mood={insights.mood} size={140} />
      <motion.div
        className="speech"
        initial={{ opacity: 0, x: -8, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 20 }}
      >
        {line}
      </motion.div>
    </div>
  )
}
