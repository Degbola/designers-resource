import { getDb } from '@/lib/db'
import { notFound } from 'next/navigation'
import { InvoiceTemplate } from '@/components/invoice-templates'
import type { InvoiceData, TemplateId } from '@/components/invoice-templates'
import type { BrandSettings } from '@/app/api/brand-settings/route'
import type { Invoice, InvoiceItem } from '@/types'

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string; id: string }>
}) {
  const { token, id } = await params
  const db = getDb()

  const client = await db.prepare('SELECT id, user_id FROM clients WHERE portal_token = ?')
    .bind(token)
    .first<{ id: number; user_id: number }>()
  if (!client) notFound()

  const invoice = await db.prepare(`SELECT i.*, c.name as client_name, c.email as client_email, c.company, c.address, c.phone, u.name as user_name, u.email as user_email
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN users u ON i.user_id = u.id
    WHERE i.id = ? AND i.client_id = ?`
  ).bind(id, client.id).first<Invoice & { company: string; address: string; phone: string; user_name: string; user_email: string; template_id?: string; brand_color?: string; accent_color?: string; logo_url?: string; terms?: string; font_family?: string; font_weight?: number; theme?: string }>()

  if (!invoice) notFound()

  const itemsResult = await db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').bind(id).all<InvoiceItem>()
  const items = itemsResult.results

  const brand = await db.prepare('SELECT * FROM user_brand_settings WHERE user_id = ?')
    .bind(client.user_id).first<BrandSettings>()

  const brandColor = invoice.brand_color || brand?.brand_color || '#1A4332'
  const accentColor = invoice.accent_color || brand?.accent_color || '#52b788'
  const logoUrl = invoice.logo_url || brand?.logo_url || ''
  const templateId = (invoice.template_id || brand?.default_template || 'classic') as TemplateId
  const fontFamily = invoice.font_family || brand?.font_family || 'Inter'
  const fontWeight = invoice.font_weight || brand?.font_weight || 400
  const theme = (invoice.theme || brand?.default_theme || 'light') as 'light' | 'dark'

  const data: InvoiceData = {
    invoice_number: invoice.invoice_number,
    status: invoice.status,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    paid_date: invoice.paid_date,
    currency: invoice.currency || 'USD',
    from: {
      name: brand?.business_name || invoice.user_name,
      email: brand?.business_email || invoice.user_email,
      phone: brand?.business_phone || '',
      address: brand?.business_address || '',
    },
    to: {
      name: invoice.client_name || '',
      email: invoice.client_email || '',
      company: invoice.company || '',
      address: invoice.address || '',
      phone: invoice.phone || '',
    },
    items: items.map(i => ({
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
      amount: i.amount,
    })),
    subtotal: invoice.subtotal,
    tax_rate: invoice.tax_rate,
    tax_amount: invoice.tax_amount,
    total: invoice.total,
    notes: invoice.notes,
    terms: invoice.terms || brand?.default_terms || '',
    logo_url: logoUrl,
    brand_color: brandColor,
    accent_color: accentColor,
    font_family: fontFamily,
    font_weight: fontWeight,
    theme,
  }

  return (
    // Break out of the portal layout's max-w-2xl so the 794px invoice fits.
    <div className="relative overflow-auto" style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}>
      <div className="mx-auto rounded-md shadow-sm" style={{ width: 'fit-content' }}>
        <InvoiceTemplate templateId={templateId} data={data} />
      </div>
    </div>
  )
}
