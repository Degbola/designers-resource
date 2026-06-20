// Brand mark shown in each invoice template — defaults to a thin colored
// circle ring (Monivoice style). When the user uploads a logo, the logo is
// shown instead.

import { fmtCurrency, fmtDate, palette } from './shared'
import type { InvoiceData } from './types'

export function BrandMark({ data, size = 56 }: { data: InvoiceData; size?: number }) {
  if (data.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={data.logo_url}
        alt=""
        style={{ maxWidth: size * 2, maxHeight: size, objectFit: 'contain' }}
      />
    )
  }
  return (
    <div
      className="rounded-full"
      style={{
        width: size,
        height: size,
        border: `2.5px solid ${data.brand_color}`,
      }}
    />
  )
}

// Shared row helpers used by all templates.

export function Row({ label, value, c }: { label: string; value: string; c: ReturnType<typeof palette> }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: c.textMuted }}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

export function Party({ label, party, c, accent }: { label: string; party: InvoiceData['from']; c: ReturnType<typeof palette>; accent?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] mb-2 font-semibold" style={{ color: c.textMuted }}>{label}</p>
      <p className="text-sm font-medium mb-1" style={accent ? { color: accent } : undefined}>{party.name}</p>
      <div className="text-xs space-y-0.5" style={{ color: c.textMuted }}>
        {party.company && <p>{party.company}</p>}
        {party.email && <p>{party.email}</p>}
        {party.phone && <p>{party.phone}</p>}
        {party.address && <p className="whitespace-pre-line">{party.address}</p>}
      </div>
    </div>
  )
}

export function ItemsList({ data, c }: { data: InvoiceData; c: ReturnType<typeof palette> }) {
  return (
    <div className="text-sm">
      <div
        className="grid grid-cols-12 gap-3 pb-2 mb-3 text-[10px] uppercase tracking-[0.14em] font-semibold"
        style={{ borderBottom: `1px solid ${c.border}`, color: c.textMuted }}
      >
        <span className="col-span-6">Description</span>
        <span className="col-span-1 text-right">Qty</span>
        <span className="col-span-2 text-right">Rate</span>
        <span className="col-span-3 text-right">Amount</span>
      </div>
      {data.items.map((item, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-3 py-3"
          style={{ borderBottom: `1px solid ${c.border}` }}
        >
          <span className="col-span-6">{item.description}</span>
          <span className="col-span-1 text-right tabular-nums" style={{ color: c.textMuted }}>{item.quantity}</span>
          <span className="col-span-2 text-right tabular-nums" style={{ color: c.textMuted }}>{fmtCurrency(item.unit_price, data.currency)}</span>
          <span className="col-span-3 text-right tabular-nums font-medium">{fmtCurrency(item.amount, data.currency)}</span>
        </div>
      ))}
    </div>
  )
}

export function Totals({ data, c, align = 'right' }: { data: InvoiceData; c: ReturnType<typeof palette>; align?: 'right' | 'full' }) {
  const widthClass = align === 'right' ? 'w-72 ml-auto' : 'w-full'
  return (
    <div className={`${widthClass} space-y-2`}>
      <Row label="Subtotal" value={fmtCurrency(data.subtotal, data.currency)} c={c} />
      <Row label={`Tax (${data.tax_rate}%)`} value={fmtCurrency(data.tax_amount, data.currency)} c={c} />
      <div
        className="flex justify-between items-baseline pt-3 mt-2"
        style={{ borderTop: `1px solid ${c.borderStrong}` }}
      >
        <span className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: c.textMuted }}>Total</span>
        <span className="text-xl font-medium tabular-nums" style={{ color: data.accent_color }}>{fmtCurrency(data.total, data.currency)}</span>
      </div>
    </div>
  )
}

export function Footer({ data, c }: { data: InvoiceData; c: ReturnType<typeof palette> }) {
  if (!data.notes && !data.terms) return null
  return (
    <div className="pt-6 space-y-4 text-xs" style={{ borderTop: `1px solid ${c.border}`, color: c.textMuted }}>
      {data.notes && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] font-semibold mb-1.5">Notes</p>
          <p className="whitespace-pre-line leading-relaxed" style={{ color: c.text }}>{data.notes}</p>
        </div>
      )}
      {data.terms && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] font-semibold mb-1.5">Terms</p>
          <p className="whitespace-pre-line leading-relaxed" style={{ color: c.text }}>{data.terms}</p>
        </div>
      )}
    </div>
  )
}

export function MetaPair({ label, value, c }: { label: string; value: string; c: ReturnType<typeof palette> }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: c.textMuted }}>{label}</p>
      <p className="text-sm mt-1">{value}</p>
    </div>
  )
}

// Quick formatters re-exported so templates don't all import shared
export { fmtCurrency, fmtDate, palette }
