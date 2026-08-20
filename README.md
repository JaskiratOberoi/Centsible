# 🪙 Centsible

A modern, chic personal spending tracker — with a lifelike coin mascot named **Penny**
who reacts to how your month is going.

## Features

- **Daily spend tracking** — quick manual entry with categories, notes, dates, and payment methods
- **Receipt scanning** — drop a receipt photo and on-device OCR (Tesseract.js) auto-captures the
  **total, date, merchant, and payment method** (network + last 4), then pre-fills the form.
  Nothing leaves your browser.
- **Wallet** — manage payment methods as animated 3D-tilt cards, each showing its 30-day spend
- **Smart analytics** — 30-day trend, category donut, spend-by-method bars, plus plain-English
  insights: month-end projection, week-over-week change, top category, no-spend days
- **Monthly budget** — an animated budget ring paces your month; Penny's mood follows it
- **Fluid UI** — Framer Motion page transitions, staggered lists, count-up numbers, drifting
  aurora background, glassmorphic cards

All data persists in `localStorage`. The app seeds ~45 days of sample data on first run so the
charts have something to say — clear it from the Overview screen.

## Run it

```bash
npm install
npm run dev
```

## Stack

Vite · React · Framer Motion · Recharts · Tesseract.js
