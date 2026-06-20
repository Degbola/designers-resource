// Template 001 — "Logo at the top right"
// Small "Invoice" meta block top-left, brand-mark ring top-right.

import type { InvoiceData } from './types'
import { palette, fmtDate } from './shared'
import { BrandMark, Party, ItemsList, Totals, Footer } from './BrandMark'

export function ClassicTemplate({ data }: { data: InvoiceData }) {
  const c = palette(data.theme)
  const font = `'${data.font_family || 'Inter'}', Inter, sans-serif`

  return (
    <div style={{ width: 794, minHeight: 1123, fontFamily: font, background: c.bg, color: c.text, padding: 64 }}>
      {/* Top — meta left, ring right */}
      <div className="flex items-start justify-between mb-20">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-2" style={{ color: c.textMuted }}>Invoice</p>
          <p className="text-sm tabular-nums" style={{ color: c.text }}>N° {data.invoice_number}</p>
          <p className="text-xs mt-1" style={{ color: c.textMuted }}>Issued {fmtDate(data.issue_date)} · Due {fmtDate(data.due_date)}</p>
        </div>
        <BrandMark data={data} size={48} />
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
