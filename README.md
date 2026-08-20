# 🪙 Centsible

A modern, chic personal spending tracker — with a lifelike coin mascot named **Penny**
who reacts to how your month is going.

## Features

- **Daily spend tracking in ₹ INR** — quick manual entry with categories, notes, dates, and
  payment methods; create **new category pills** and **new cards / UPI / wallets** inline
- **Personal vs work expenses** — tag work spends as reimbursable, click their 💼 badge when
  paid back, and track the outstanding total
- **Receipt scanning** — drop a receipt photo and on-device OCR (Tesseract.js) auto-captures the
  **total, date, merchant, and payment method** (network + last 4, UPI apps), then pre-fills the
  form. Understands Indian formats (₹ / Rs., whole-rupee totals, dd/mm/yyyy). Nothing leaves
  your browser.
- **Expenses explorer** — filter by personal/work, category, and period, then **export to CSV**
  (Excel-ready, UTF-8) for reimbursement claims or bookkeeping
- **Wallet** — manage payment methods as animated 3D-tilt cards, each showing its 30-day spend
- **Smart analytics** — 30-day trend, category donut, spend-by-method bars, plus plain-English
  insights: month-end projection, week-over-week change, top category, no-spend days
- **Monthly budget** — an animated budget ring paces your month; Penny's mood follows it
- **Fluid UI** — Framer Motion page transitions, staggered lists, count-up numbers, drifting
  aurora background, glassmorphic cards

All data persists in `localStorage`. The app seeds ~45 days of sample data on first run so the
charts have something to say — clear it from the Overview screen.

## Accounts & cloud sync

The app has a login/register gate. Out of the box it runs **local-only** (accounts
and data stay in the browser). To make accounts work **across devices**:

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open its **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql)
3. Copy **Project Settings → API → Project URL & anon public key** into
   [`src/supabase-config.js`](src/supabase-config.js)
4. Optional but recommended for instant signups: **Authentication → Providers →
   Email → disable "Confirm email"** (otherwise users must click a confirmation
   link before their first login)

The anon key is public by design — Row Level Security (in the schema) is what
protects each user's data. App state syncs to a single JSON row per user
(last-write-wins), pulled on login and pushed ~1s after each change; the sync
dot next to your avatar shows the status.

## Run it

```bash
npm install
npm run dev
```

## Stack

Vite · React · Framer Motion · Recharts · Tesseract.js
