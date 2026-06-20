// Shared type used by every invoice template (HTML preview + PDF render).

export interface InvoiceLineItem {
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export interface InvoiceParty {
  name: string
  email?: string
  phone?: string
  address?: string
  company?: string
}

export interface InvoiceData {
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  issue_date: string
  due_date: string
  paid_date?: string | null
  currency: string

  from: InvoiceParty
  to: InvoiceParty

  items: InvoiceLineItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number

  notes?: string
  terms?: string

  // Branding (resolved at render time — invoice overrides win over user defaults)
  logo_url: string
  brand_color: string
  accent_color: string
  font_family: string
  font_weight: number
  theme: 'light' | 'dark'
}

export type TemplateId = 'classic' | 'structured' | 'bold' | 'banner' | 'minimal'

export const TEMPLATE_LIST: { id: TemplateId; label: string; description: string }[] = [
  { id: 'classic',    label: 'Template 001', description: 'Logo at the top right' },
  { id: 'structured', label: 'Template 003', description: 'Logo at the top left' },
  { id: 'bold',       label: 'Template 006', description: 'Big title at the top' },
  { id: 'banner',     label: 'Template 002', description: 'Logo at the bottom right' },
  { id: 'minimal',    label: 'Template 005', description: 'Big title at the bottom' },
]
