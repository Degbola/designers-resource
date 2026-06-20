// Template 002 — "Logo at the bottom right"
// Small meta + body up top, big "Invoice" wordmark + brand-mark ring at the BOTTOM.

import type { InvoiceData } from './types'
import { palette, fmtDate } from './shared'
import { BrandMark, Party, ItemsList, Totals, Footer } from './BrandMark'

export function BannerTemplate({ data }: { data: InvoiceData }) {
  const c = palette(data.theme)
  const font = `'${data.font_family || 'Inter'}', Inter, sans-serif`

  return (
    <div
      className="flex flex-col"
      style={{ width: 794, minHeight: 1123, fontFamily: font, background: c.bg, color: c.text, padding: 64 }}
    >
      {/* Small meta top-left */}
      <div className="flex items-start justify-between mb-16">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-2" style={{ color: c.textMuted }}>Invoice</p>
          <p className="text-sm tabular-nums" style={{ color: c.text }}>N° {data.invoice_number}</p>
          <p className="text-xs mt-1" style={{ color: c.textMuted }}>Issued {fmtDate(data.issue_date)} · Due {fmtDate(data.due_date)}</p>
        </div>
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

      {/* Footer notes */}
      <Footer data={data} c={c} />

      {/* Spacer pushes wordmark to bottom */}
      <div className="flex-1" />

      {/* Bottom — big wordmark + ring */}
      <div className="flex items-end justify-between mt-16 pt-10" style={{ borderTop: `1px solid ${c.border}` }}>
        <h1
          className="font-light tracking-tight leading-none"
          style={{ fontSize: 96, color: c.text, letterSpacing: '-0.04em' }}
        >
          Invoice
        </h1>
        <BrandMark data={data} size={56} />
      </div>
    </div>
  )
}
