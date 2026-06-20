// Template 006 — "Logo at the top right" with big top wordmark
// Big "Invoice" wordmark TOP-LEFT, brand-mark ring TOP-RIGHT.

import type { InvoiceData } from './types'
import { palette, fmtDate } from './shared'
import { BrandMark, Party, ItemsList, Totals, Footer } from './BrandMark'

export function BoldTemplate({ data }: { data: InvoiceData }) {
  const c = palette(data.theme)
  const font = `'${data.font_family || 'Inter'}', Inter, sans-serif`

  return (
    <div style={{ width: 794, minHeight: 1123, fontFamily: font, background: c.bg, color: c.text, padding: 64 }}>
      {/* Top — huge wordmark + ring */}
      <div className="flex items-start justify-between mb-16">
        <h1
          className="font-light tracking-tight leading-none"
          style={{ fontSize: 96, color: c.text, letterSpacing: '-0.04em' }}
        >
          Invoice
        </h1>
        <BrandMark data={data} size={56} />
      </div>

      {/* Meta line under wordmark */}
      <div className="flex items-center gap-3 mb-16 text-sm" style={{ color: c.textMuted }}>
        <span>N° <span style={{ color: c.text }} className="tabular-nums">{data.invoice_number}</span></span>
        <span style={{ color: c.border }}>·</span>
        <span>Issued {fmtDate(data.issue_date)}</span>
        <span style={{ color: c.border }}>·</span>
        <span>Due {fmtDate(data.due_date)}</span>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        <Party label="From" party={data.from} c={c} />
        <Party label="Bill To" party={data.to} c={c} accent={data.brand_color} />
      </div>

      {/* Items */}
      <div className="mb-12">
        <ItemsList data={data} c={c} />
      </div>

      {/* Totals */}
      <div className="mb-16"><Totals data={data} c={c} /></div>

      {/* Footer */}
      <Footer data={data} c={c} />
    </div>
  )
}
