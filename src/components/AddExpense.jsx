import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store.jsx'
import { isoDay, uid, fmtMoney, CATEGORY_COLORS } from '../utils.js'
import { scanReceipt } from '../ocr.js'

function guessCategory(merchant = '') {
  const m = merchant.toLowerCase()
  if (/market|grocer|mart|foods|bazaar|kirana|bigbasket|blinkit|zepto/.test(m)) return 'groceries'
  if (/cafe|coffee|pizza|grill|kitchen|restaurant|bar|diner|bakery|dhaba|swiggy|zomato|biryani/.test(m)) return 'food'
  if (/uber|ola|rapido|shell|indian oil|bharat petroleum|hp petrol|fuel|gas|parking|metro|irctc/.test(m)) return 'transport'
  if (/pharmacy|apollo|medplus|clinic|dental|gym|fitness|cult/.test(m)) return 'health'
  if (/cinema|theater|pvr|inox|spotify|netflix|hotstar|arcade/.test(m)) return 'entertainment'
  if (/electric|water|utility|internet|broadband|airtel|jio|vodafone|bsnl/.test(m)) return 'bills'
  return null
}

function FoundPill({ ok, children }) {
  return <span className={`found-pill${ok ? '' : ' miss'}`}>{ok ? '✓' : '·'} {children}</span>
}

const METHOD_KINDS = [
  { id: 'credit', label: 'Credit card' },
  { id: 'debit', label: 'Debit card' },
  { id: 'cash', label: 'Cash' },
  { id: 'wallet', label: 'UPI / wallet' },
]

export default function AddExpense({ goTo }) {
  const { methods, categories, dispatch } = useStore()
  const [form, setForm] = useState({
    amount: '', note: '', category: 'food', date: isoDay(), methodId: methods[0]?.id || '',
    scope: 'personal',
  })
  const [scan, setScan] = useState(null) // {status, progress, result, previewUrl, error}
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [newCat, setNewCat] = useState(null) // null | {emoji, label}
  const [newMethod, setNewMethod] = useState(null) // null | {label, kind, last4}

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function createCategory() {
    const label = newCat.label.trim()
    if (!label) return
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || uid()
    if (categories.some((c) => c.id === id)) {
      set('category', id)
      setNewCat(null)
      return
    }
    const used = new Set(categories.map((c) => c.color))
    const color = CATEGORY_COLORS.find((c) => !used.has(c)) || CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length]
    dispatch({ type: 'add-category', category: { id, label, emoji: newCat.emoji.trim() || '🏷️', color } })
    set('category', id)
    setNewCat(null)
  }

  function createMethod() {
    const label = newMethod.label.trim()
    if (!label) return
    const id = uid()
    dispatch({
      type: 'add-method',
      method: {
        id,
        label,
        kind: newMethod.kind,
        last4: /^\d{4}$/.test(newMethod.last4) ? newMethod.last4 : null,
        color: CATEGORY_COLORS[(Math.random() * CATEGORY_COLORS.length) | 0],
      },
    })
    set('methodId', id)
    setNewMethod(null)
  }

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const previewUrl = URL.createObjectURL(file)
    setScan({ status: 'scanning', progress: 0, previewUrl })
    try {
      const result = await scanReceipt(file, (p) =>
        setScan((s) => (s?.status === 'scanning' ? { ...s, progress: p } : s))
      )
      setScan({ status: 'done', previewUrl, result })
      setForm((f) => {
        const next = { ...f }
        if (result.total != null) next.amount = String(result.total)
        if (result.date) next.date = result.date
        if (result.merchant) {
          next.note = result.merchant
          const cat = guessCategory(result.merchant)
          if (cat && categories.some((c) => c.id === cat)) next.category = cat
        }
        if (result.payment) {
          const hit = methods.find(
            (m) =>
              (result.payment.last4 && m.last4 === result.payment.last4) ||
              (result.payment.kind && m.kind === result.payment.kind)
          )
          if (hit) next.methodId = hit.id
        }
        return next
      })
    } catch (err) {
      setScan({ status: 'error', previewUrl, error: String(err?.message || err) })
    }
  }

  function submit(e) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) return
    dispatch({
      type: 'add-expense',
      expense: {
        id: uid(),
        amount: +amount.toFixed(2),
        note: form.note.trim(),
        category: form.category,
        date: form.date,
        methodId: form.methodId,
        scope: form.scope,
        reimbursed: form.scope === 'work' ? false : undefined,
      },
    })
    setSaved(true)
    setTimeout(() => goTo('home'), 900)
  }

  const r = scan?.result

  return (
    <div className="grid two" style={{ alignItems: 'start' }}>
      <motion.div className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="section-title">Log an expense</div>
        <div className="section-sub">Type it in, or let a receipt do the talking →</div>
        <form onSubmit={submit} className="form-grid">
          <div className="field">
            <label>Amount (₹)</label>
            <input
              type="number" step="0.01" min="0" placeholder="0" required
              value={form.amount} onChange={(e) => set('amount', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={form.date} max={isoDay()} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div className="field span-2">
            <label>Note</label>
            <input
              placeholder="What was it? (e.g. Momos with Ana)"
              value={form.note} onChange={(e) => set('note', e.target.value)}
            />
          </div>
          <div className="field span-2">
            <label>This was a…</label>
            <div className="scope-toggle">
              <button
                type="button" className={form.scope === 'personal' ? 'on' : ''}
                onClick={() => set('scope', 'personal')}
              >
                🏠 Personal expense
              </button>
              <button
                type="button" className={form.scope === 'work' ? 'on work' : ''}
                onClick={() => set('scope', 'work')}
              >
                💼 Work — reimbursable
              </button>
            </div>
            {form.scope === 'work' && (
              <div style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
                Tagged for reimbursement — track & export it from the Expenses tab.
              </div>
            )}
          </div>
          <div className="field span-2">
            <label>Category</label>
            <div className="cat-picker">
              {categories.map((c) => (
                <button
                  key={c.id} type="button"
                  className={form.category === c.id ? 'on' : ''}
                  style={{ '--cat-color': c.color }}
                  onClick={() => set('category', c.id)}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
              <button
                type="button" className="new-pill"
                onClick={() => setNewCat(newCat ? null : { emoji: '', label: '' })}
              >
                + New
              </button>
            </div>
            <AnimatePresence>
              {newCat && (
                <motion.div
                  className="inline-add"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    style={{ width: 58 }} placeholder="🏷️" maxLength={4} value={newCat.emoji}
                    onChange={(e) => setNewCat((c) => ({ ...c, emoji: e.target.value }))}
                  />
                  <input
                    placeholder="Category name (e.g. Pets)" value={newCat.label} autoFocus
                    onChange={(e) => setNewCat((c) => ({ ...c, label: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createCategory() } }}
                  />
                  <button type="button" className="btn small" onClick={createCategory}>Add</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="field span-2">
            <label>Paid with</label>
            <select value={form.methodId} onChange={(e) => set('methodId', e.target.value)}>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}{m.last4 ? ` ••${m.last4}` : ''}
                </option>
              ))}
            </select>
            {!newMethod ? (
              <button
                type="button" className="linklike" style={{ alignSelf: 'flex-start' }}
                onClick={() => setNewMethod({ label: '', kind: 'credit', last4: '' })}
              >
                + add a new card / payment method
              </button>
            ) : (
              <motion.div
                className="inline-add"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              >
                <input
                  placeholder="Name (e.g. HDFC Regalia)" value={newMethod.label} autoFocus
                  onChange={(e) => setNewMethod((m) => ({ ...m, label: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createMethod() } }}
                />
                <select
                  value={newMethod.kind}
                  onChange={(e) => setNewMethod((m) => ({ ...m, kind: e.target.value }))}
                >
                  {METHOD_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
                <input
                  style={{ width: 90 }} placeholder="last 4" maxLength={4} inputMode="numeric"
                  value={newMethod.last4}
                  onChange={(e) => setNewMethod((m) => ({ ...m, last4: e.target.value.replace(/\D/g, '') }))}
                />
                <button type="button" className="btn small" onClick={createMethod}>Add</button>
                <button type="button" className="linklike" onClick={() => setNewMethod(null)}>cancel</button>
              </motion.div>
            )}
          </div>
          <div className="span-2" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn" type="submit" disabled={saved}>
              {saved ? 'Saved ✓' : 'Save expense'}
            </button>
            <AnimatePresence>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ fontSize: 22 }}
                >
                  🎉
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </form>
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="section-title">Scan a receipt</div>
        <div className="section-sub">Snap or drop a photo — I'll read the total, date, merchant & payment method.</div>

        {!scan && (
          <div
            className={`dropzone${dragOver ? ' over' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
          >
            <div className="dz-emoji">🧾</div>
            <div className="dz-title">Drop a receipt photo here</div>
            <div className="dz-sub">or click to browse · JPG / PNG · reads on-device, nothing uploaded</div>
          </div>
        )}

        <input
          ref={fileRef} type="file" accept="image/*" hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <AnimatePresence mode="wait">
          {scan?.status === 'scanning' && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="scan-preview">
                <img src={scan.previewUrl} alt="receipt" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Reading your receipt…</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>
                    On-device OCR — first scan downloads the reader (~few MB)
                  </div>
                  <div className="scanbar">
                    <motion.div
                      animate={{ width: `${Math.round((scan.progress || 0) * 100)}%` }}
                      transition={{ ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {scan?.status === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="scan-preview">
                <img src={scan.previewUrl} alt="receipt" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Here's what I found:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    <FoundPill ok={r.total != null}>{r.total != null ? `Total ${fmtMoney(r.total, { cents: true })}` : 'No total found'}</FoundPill>
                    <FoundPill ok={!!r.date}>{r.date || 'No date'}</FoundPill>
                    <FoundPill ok={!!r.merchant}>{r.merchant || 'No merchant'}</FoundPill>
                    <FoundPill ok={!!r.payment}>
                      {r.payment
                        ? [r.payment.network || r.payment.kind, r.payment.last4 && `••${r.payment.last4}`].filter(Boolean).join(' ')
                        : 'No payment info'}
                    </FoundPill>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    Form's pre-filled ← double-check and save.
                  </div>
                  <div>
                    <button className="btn small ghost" type="button" onClick={() => { setScan(null); if (fileRef.current) fileRef.current.value = '' }}>
                      Scan another
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {scan?.status === 'error' && (
            <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="empty-note">
                Hmm, couldn't read that one ({scan.error}).{' '}
                <button className="linklike" onClick={() => setScan(null)}>Try another photo</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
