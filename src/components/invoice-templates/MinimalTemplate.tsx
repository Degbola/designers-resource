// Template 005 — "Logo at the top right" with bottom wordmark
// Small meta + body, brand-mark ring at top-right, big "Invoice" wordmark at BOTTOM-LEFT.

import type { InvoiceData } from './types'
import { palette, fmtDate } from './shared'
import { BrandMark, Party, ItemsList, Totals, Footer } from './BrandMark'

export function MinimalTemplate({ data }: { data: InvoiceData }) {
  const c = palette(data.theme)
  const font = `'${data.font_family || 'Inter'}', Inter, sans-serif`

  return (
    <div
      className="flex flex-col"
      style={{ width: 794, minHeight: 1123, fontFamily: font, background: c.bg, color: c.text, padding: 64 }}
    >
      {/* Top — small meta left, ring right */}
      <div className="flex items-start justify-between mb-16">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-2" style={{ color: c.textMuted }}>Invoice</p>
          <p className="text-sm tabular-nums" style={{ color: c.text }}>N° {data.invoice_number}</p>
          <p className="text-xs mt-1" style={{ color: c.textMuted }}>Issued {fmtDate(data.issue_date)} · Due {fmtDate(data.due_date)}</p>
        </div>
        <BrandMark data={data} size={48} />
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-12 mb-14">
        <Party label="From" party={data.from} c={c} />
        <Party label="Bill To" party={data.to} c={c} accent={data.brand_color} />
      </div>

      {/* Items */}
      <div className="mb-12">
        <ItemsList data={data} c={c} />
      </div>

      {/* Totals */}
      <div className="mb-12"><Totals data={data} c={c} /></div>

      {/* Footer */}
      <Footer data={data} c={c} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom — big wordmark only */}
      <h1
        className="font-light tracking-tight leading-none mt-16 pt-10"
        style={{ fontSize: 96, color: c.text, letterSpacing: '-0.04em', borderTop: `1px solid ${c.border}` }}
      >
        Invoice
      </h1>
    </div>
  )
}
