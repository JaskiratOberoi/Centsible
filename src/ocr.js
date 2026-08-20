let workerPromise = null
function getWorker(onProgress) {
  if (!workerPromise) {
    // dynamic import keeps the OCR engine out of the main bundle
    workerPromise = import('tesseract.js').then(({ createWorker }) =>
      createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) onProgress(m.progress)
        },
      })
    )
  }
  return workerPromise
}

const MONEY = /(?:[$€£₹]\s*)?(\d{1,3}(?:,\d{3})*|\d+)\.(\d{2})\b/g

function moniesIn(line) {
  const out = []
  let m
  MONEY.lastIndex = 0
  while ((m = MONEY.exec(line))) out.push(parseFloat(`${m[1].replace(/,/g, '')}.${m[2]}`))
  return out
}

function parseDate(text) {
  // 08/20/2026, 20-08-2026, 2026-08-20
  let m = text.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  m = text.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/)
  if (m) {
    let [, a, b, y] = m
    if (y.length === 2) y = `20${y}`
    let mo = +a, day = +b
    if (mo > 12 && day <= 12) [mo, day] = [day, mo]
    if (mo >= 1 && mo <= 12 && day >= 1 && day <= 31)
      return `${y}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  // Aug 20, 2026 / 20 Aug 2026
  const months = 'jan feb mar apr may jun jul aug sep oct nov dec'.split(' ')
  m = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i)
  if (m) return `${m[3]}-${String(months.indexOf(m[1].toLowerCase()) + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`
  m = text.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})\b/i)
  if (m) return `${m[3]}-${String(months.indexOf(m[2].toLowerCase()) + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return null
}

function parsePayment(text) {
  const lower = text.toLowerCase()
  const last4 = text.match(/(?:x{2,4}|\*{2,4}|•{2,4})\s*(\d{4})\b/i)?.[1] || null
  let network = null
  if (/\bvisa\b/i.test(text)) network = 'Visa'
  else if (/\bmaster\s*card\b|\bmastercard\b/i.test(text)) network = 'Mastercard'
  else if (/\bamex\b|american express/i.test(text)) network = 'Amex'
  else if (/\bdiscover\b/i.test(text)) network = 'Discover'
  let kind = null
  if (/\bdebit\b/.test(lower)) kind = 'debit'
  else if (/\bcredit\b/.test(lower) || network) kind = 'credit'
  else if (/\bcash\b/.test(lower)) kind = 'cash'
  else if (/\bupi\b|apple pay|google pay|\bgpay\b/i.test(text)) kind = 'wallet'
  if (!network && !kind && !last4) return null
  return { network, kind, last4 }
}

const TOTAL_WORDS = /\b(grand\s*total|amount\s*due|balance\s*due|total\s*due|total)\b/i
const NOT_TOTAL = /\b(sub\s*-?\s*total|total\s*(items|qty|count|savings|discount)|tax)\b/i

export function parseReceiptText(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  let total = null
  for (const line of lines) {
    if (TOTAL_WORDS.test(line) && !NOT_TOTAL.test(line)) {
      const vals = moniesIn(line)
      if (vals.length) total = Math.max(total ?? 0, ...vals)
    }
  }
  if (total == null) {
    // fallback: the largest money value on the receipt is almost always the total
    const all = lines.flatMap(moniesIn)
    if (all.length) total = Math.max(...all)
  }

  const junk = /receipt|invoice|thank|welcome|order|cashier|tel|phone|www\.|http|\d{3,}/i
  const merchant =
    lines.slice(0, 6).find((l) => /[a-z]/i.test(l) && l.length >= 3 && !junk.test(l) && !moniesIn(l).length) || null

  return {
    total,
    date: parseDate(text),
    merchant,
    payment: parsePayment(text),
    raw: text,
  }
}

export async function scanReceipt(imageFile, onProgress) {
  const worker = await getWorker(onProgress)
  const { data } = await worker.recognize(imageFile)
  return parseReceiptText(data.text || '')
}
