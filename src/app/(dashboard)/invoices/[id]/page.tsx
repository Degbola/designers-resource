import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { InvoiceTemplate } from '@/components/invoice-templates'
import { InvoiceA4Frame } from '@/components/invoice-templates/A4Frame'
import type { InvoiceData, TemplateId } from '@/components/invoice-templates'
import type { BrandSettings } from '@/app/api/brand-settings/route'
import type { Invoice, InvoiceItem } from '@/types'
import { InvoiceDetailActions } from './_Actions'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) redirect('/login')

  const { id } = await params
  const db = getDb()

  const invoice = await db.prepare(`SELECT i.*, c.name as client_name, c.email as client_email, c.company, c.address, c.phone, c.portal_token
    FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ? AND i.user_id = ?`
  ).bind(id, user.id).first<Invoice & { company: string; address: string; phone: string; portal_token: string; template_id?: string; brand_color?: string; accent_color?: string; logo_url?: string; terms?: string; font_family?: string; font_weight?: number; theme?: string }>()

  if (!invoice) notFound()

  const itemsResult = await db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').bind(id).all<InvoiceItem>()
  const items = itemsResult.results

  const brand = await db.prepare('SELECT * FROM user_brand_settings WHERE user_id = ?')
    .bind(user.id).first<BrandSettings>()

  // Resolve branding — invoice overrides win
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
      name: brand?.business_name || user.name,
      email: brand?.business_email || user.email,
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
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-dark-100 transition-colors">
            <ArrowLeft size={16} /> Back to Invoices
          </Link>
          <Badge variant={invoice.status}>{invoice.status}</Badge>
        </div>
        <InvoiceDetailActions
          invoiceId={Number(id)}
          templateId={templateId}
          data={data}
          currentTemplate={templateId}
          portalToken={invoice.portal_token || ''}
          clientEmail={invoice.client_email || ''}
          status={invoice.status}
        />
      </div>

      {/* Rendered template — proper A4 ratio */}
      <Card className="!p-3 bg-[#f5f5f7] dark:!bg-[rgba(0,0,0,0.2)]">
        <InvoiceA4Frame>
          <InvoiceTemplate templateId={templateId} data={data} />
        </InvoiceA4Frame>
      </Card>
    </div>
  )
}
