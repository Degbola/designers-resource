'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { ArrowLeft, Plus, X, Upload, Check, Loader2, Eye } from 'lucide-react'
import { CURRENCIES, generateInvoiceNumber } from '@/lib/utils'
import { resizeImageToBase64 } from '@/lib/image-resize'
import { InvoiceTemplate, TEMPLATE_LIST } from '@/components/invoice-templates'
import type { InvoiceData, TemplateId } from '@/components/invoice-templates'
import { TemplateThumbnail } from '@/components/invoice-templates/Thumbnail'
import { InvoiceA4Frame } from '@/components/invoice-templates/A4Frame'
import { FontSelector } from '@/components/fonts/font-selector'
import { loadGoogleFont } from '@/lib/font-loader'
import type { BrandSettings } from '@/app/api/brand-settings/route'
import type { Client, Project } from '@/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: '₵',
  KES: 'KSh', ZAR: 'R', CAD: 'C$', AUD: 'A$', JPY: '¥', CHF: 'Fr', INR: '₹',
}

interface LineItem { description: string; quantity: number; unit_price: number }

export function CreateInvoiceClient({
  clients,
  projects,
  brand,
}: {
  clients: Client[]
  projects: Project[]
  brand: BrandSettings
}) {
  const router = useRouter()

  const [templateId, setTemplateId] = useState<TemplateId>((brand.default_template as TemplateId) || 'classic')
  const [brandColor, setBrandColor] = useState(brand.brand_color)
  const [accentColor, setAccentColor] = useState(brand.accent_color)
  const [logoUrl, setLogoUrl] = useState(brand.logo_url)
  const [fontFamily, setFontFamily] = useState(brand.font_family || 'Inter')
  const [fontWeight, setFontWeight] = useState(brand.font_weight || 400)
  const [theme, setTheme] = useState<'light' | 'dark'>(brand.default_theme || 'light')
  const [showBrandOverride, setShowBrandOverride] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [previewOpen, setPreviewOpen] = useState(false)

  const [form, setForm] = useState({
    // Generated client-side after mount to avoid SSR/CSR hydration mismatch
    // (generateInvoiceNumber uses Math.random())
    invoice_number: '',
    client_name: '',
    client_email: '',
    project_name: '',
    status: 'draft',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_rate: '0',
    notes: '',
    terms: brand.default_terms,
    sender_email: brand.business_email,
    currency: 'USD',
  })
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit_price: 0 }])
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)
  const [saving, setSaving] = useState(false)

  // Generate invoice number client-side after mount (avoids hydration mismatch from Math.random())
  useEffect(() => {
    setForm(f => f.invoice_number ? f : { ...f, invoice_number: generateInvoiceNumber() })
  }, [])

  const clientSuggestions = useMemo(() => {
    if (!form.client_name) return [] as Client[]
    return clients.filter(c => c.name.toLowerCase().includes(form.client_name.toLowerCase())).slice(0, 5)
  }, [form.client_name, clients])
  void projects

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const taxAmount = subtotal * (Number(form.tax_rate) / 100)
  const total = subtotal + taxAmount

  const matchedClient = clients.find(c => c.name.toLowerCase() === form.client_name.toLowerCase())

  // Which required fields are still empty? Shown next to the Create button.
  const missingFields: string[] = []
  if (!form.client_name.trim()) missingFields.push('Client')
  if (!form.due_date) missingFields.push('Due date')
  if (!form.issue_date) missingFields.push('Issue date')

  // Build data for live preview
  const previewData: InvoiceData = {
    invoice_number: form.invoice_number,
    status: form.status as InvoiceData['status'],
    issue_date: form.issue_date || new Date().toISOString().split('T')[0],
    due_date: form.due_date || form.issue_date || new Date().toISOString().split('T')[0],
    paid_date: null,
    currency: form.currency,
    from: {
      name: brand.business_name || 'Your Business',
      email: brand.business_email,
      phone: brand.business_phone,
      address: brand.business_address,
    },
    to: {
      name: form.client_name || 'Client Name',
      email: matchedClient?.email || form.client_email,
      company: matchedClient?.company || '',
      address: matchedClient?.address || '',
      phone: matchedClient?.phone || '',
    },
    items: items.map(i => ({
      description: i.description || 'Item description',
      quantity: i.quantity,
      unit_price: i.unit_price,
      amount: i.quantity * i.unit_price,
    })),
    subtotal,
    tax_rate: Number(form.tax_rate),
    tax_amount: taxAmount,
    total,
    notes: form.notes,
    terms: form.terms,
    logo_url: logoUrl,
    brand_color: brandColor,
    accent_color: accentColor,
    font_family: fontFamily,
    font_weight: fontWeight,
    theme,
  }

  const handleLogoUpload = async (file: File) => {
    try {
      const dataUrl = await resizeImageToBase64(file, 600)
      setLogoUrl(dataUrl)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_name.trim()) return
    setSaving(true)
    try {
      // Step 1 — create invoice (uses existing API)
      const createRes = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_number: form.invoice_number,
          client_name: form.client_name.trim(),
          client_email: form.client_email.trim() || undefined,
          project_name: form.project_name.trim() || undefined,
          status: form.status,
          issue_date: form.issue_date,
          due_date: form.due_date,
          tax_rate: Number(form.tax_rate),
          notes: form.notes,
          sender_email: form.sender_email.trim() || undefined,
          currency: form.currency,
          items: items.filter(i => i.description || i.unit_price > 0),
        }),
      })
      if (!createRes.ok) {
        setSaving(false)
        return
      }
      const created = await createRes.json() as { id: number }

      // Step 2 — persist template + branding overrides
      const brandOverride = showBrandOverride
      await fetch(`/api/invoices/${created.id}/template`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          brand_color: brandOverride ? brandColor : '',
          accent_color: brandOverride ? accentColor : '',
          logo_url: brandOverride ? logoUrl : '',
          font_family: brandOverride ? fontFamily : '',
          font_weight: brandOverride ? fontWeight : 0,
          theme,
          terms: form.terms,
        }),
      })

      router.push(`/invoices/${created.id}`)
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items]
    updated[idx] = { ...updated[idx], [field]: value }
    setItems(updated)
  }

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-dark-100 transition-colors">
          <ArrowLeft size={16} /> Back to Invoices
        </Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {missingFields.length > 0 && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400">
              Missing: {missingFields.join(', ')}
            </span>
          )}
          <Button variant="secondary" onClick={() => setPreviewOpen(!previewOpen)} className="lg:hidden">
            <Eye size={14} /> {previewOpen ? 'Hide' : 'Preview'}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || missingFields.length > 0}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Template picker — horizontal strip */}
      <Card className="mb-6 !p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-300">Template</p>
          <div className="flex items-center gap-1 rounded border border-dark-600 dark:border-[rgba(255,255,255,0.08)] p-0.5">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-2.5 py-1 text-[10px] font-display font-semibold uppercase tracking-[0.06em] rounded transition-colors ${theme === 'light' ? 'bg-accent text-white' : 'text-dark-400 hover:text-dark-200'}`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-2.5 py-1 text-[10px] font-display font-semibold uppercase tracking-[0.06em] rounded transition-colors ${theme === 'dark' ? 'bg-accent text-white' : 'text-dark-400 hover:text-dark-200'}`}
            >
              Dark
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {TEMPLATE_LIST.map(t => {
            const selected = templateId === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                className={`text-left rounded-md border transition-all overflow-hidden ${
                  selected
                    ? 'border-accent ring-2 ring-accent/30'
                    : 'border-dark-600 dark:border-[rgba(255,255,255,0.08)] hover:border-accent/40'
                }`}
              >
                <div className="bg-white border-b border-dark-600 dark:border-[rgba(255,255,255,0.05)]">
                  <TemplateThumbnail templateId={t.id} brandColor={brandColor} accentColor={accentColor} className="w-full h-auto" />
                </div>
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-display font-semibold uppercase tracking-[0.06em] text-dark-100 flex items-center gap-1">
                    {t.label} {selected && <Check size={10} className="text-accent" />}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <h3 className="font-serif text-lg mb-4">Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Invoice Number" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
                <div>
                  <label className="block text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-300 mb-1.5">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded px-3 py-[7px] text-[13px] font-display text-dark-100 focus:outline-none focus:border-accent/50 transition-colors cursor-pointer"
                  >
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.label.split('—')[1]?.trim()}</option>)}
                  </select>
                </div>
              </div>
              <div className="relative">
                <Input
                  label="Client *"
                  value={form.client_name}
                  onChange={(e) => { setForm({ ...form, client_name: e.target.value }); setShowClientSuggestions(true) }}
                  onBlur={() => setTimeout(() => setShowClientSuggestions(false), 150)}
                  placeholder="Type or select existing"
                  required
                  autoComplete="off"
                />
                {showClientSuggestions && clientSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-md border border-dark-600 dark:border-[rgba(255,255,255,0.10)] bg-[#FDFCFA] dark:bg-[#0a0f0b] shadow-lg overflow-hidden">
                    {clientSuggestions.map(c => (
                      <button key={c.id} type="button"
                        onMouseDown={() => { setForm({ ...form, client_name: c.name, client_email: c.email || '' }); setShowClientSuggestions(false) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                      >
                        {c.name}
                        {c.company && <span className="text-xs text-dark-400 ml-2">{c.company}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form.client_name && !matchedClient && (
                <Input
                  label="Client Email"
                  type="email"
                  value={form.client_email}
                  onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                  placeholder="client@example.com"
                />
              )}
              <Input label="Project (optional)" value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} placeholder="Leave blank if none" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Issue Date *" type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} required />
                <Input label="Due Date *" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
                <Input label="Tax Rate (%)" type="number" min="0" max="100" step="0.1" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
              </div>
            </div>
          </Card>

          {/* Line items */}
          <Card>
            <h3 className="font-serif text-lg mb-4">Line Items</h3>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded p-3 space-y-2">
                  <input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="w-full bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded px-3 py-[7px] text-[13px] font-display text-dark-100 focus:outline-none focus:border-accent/50 transition-colors"
                  />
                  <div className="flex gap-2 items-center">
                    <input type="number" placeholder="Qty" min="1"
                      value={item.quantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      className="w-16 bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded px-2 py-[7px] text-[13px] font-display text-dark-100 focus:outline-none focus:border-accent/50 transition-colors"
                    />
                    <div className="flex items-stretch flex-1 min-w-0">
                      <span className="flex items-center px-2 text-[11px] font-display text-dark-400 bg-[#F5F3F0] dark:bg-[rgba(255,255,255,0.02)] border border-r-0 border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded-l flex-shrink-0">
                        {CURRENCY_SYMBOLS[form.currency] || form.currency}
                      </span>
                      <input type="number" placeholder="0.00" min="0" step="0.01"
                        value={item.unit_price || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                        className="flex-1 min-w-0 bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded-r px-3 py-[7px] text-[13px] font-display text-dark-100 focus:outline-none focus:border-accent/50 transition-colors"
                      />
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="p-1.5 text-dark-400 hover:text-red-500 cursor-pointer">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={addItem} className="mt-3">
              <Plus size={14} /> Add Item
            </Button>
          </Card>

          {/* Branding override */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg">Branding</h3>
              <button
                type="button"
                onClick={() => setShowBrandOverride(!showBrandOverride)}
                className="text-[11px] font-display uppercase tracking-[0.06em] text-accent hover:underline"
              >
                {showBrandOverride ? 'Use defaults' : 'Override for this invoice'}
              </button>
            </div>
            {!showBrandOverride ? (
              <p className="text-xs text-dark-400">Using your Brand Settings defaults. Click &ldquo;Override&rdquo; to customize just this invoice.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded border border-dashed border-dark-600 dark:border-[rgba(255,255,255,0.10)] flex items-center justify-center bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.02)] overflow-hidden">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-[9px] uppercase tracking-[0.1em] text-dark-400">No logo</span>
                    )}
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }}
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                      <Upload size={12} /> {logoUrl ? 'Replace' : 'Upload'}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ColorRow label="Primary" value={brandColor} onChange={setBrandColor} />
                  <ColorRow label="Accent" value={accentColor} onChange={setAccentColor} />
                </div>
                <FontSelector
                  label="Font"
                  selectedFamily={fontFamily}
                  selectedWeight={fontWeight}
                  onFontChange={(family, weight) => {
                    loadGoogleFont(family, weight)
                    setFontFamily(family)
                    setFontWeight(weight)
                  }}
                />
              </div>
            )}
          </Card>

          {/* Notes + Terms */}
          <Card>
            <h3 className="font-serif text-lg mb-4">Notes & Terms</h3>
            <div className="space-y-3">
              <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Visible on invoice…" />
              <Textarea label="Terms & Conditions" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} placeholder="Payment terms, late fees, bank details…" />
              <Input label="Your reply-to email" type="email" value={form.sender_email} onChange={(e) => setForm({ ...form, sender_email: e.target.value })} placeholder="yourname@example.com" />
            </div>
          </Card>

          {/* Totals summary */}
          <Card>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-dark-300"><span>Subtotal</span><span className="tabular-nums">{CURRENCY_SYMBOLS[form.currency] || ''}{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-dark-300"><span>Tax ({form.tax_rate}%)</span><span className="tabular-nums">{CURRENCY_SYMBOLS[form.currency] || ''}{taxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between pt-2 mt-2 border-t border-dark-600 dark:border-[rgba(255,255,255,0.08)]">
                <span className="font-display font-semibold uppercase tracking-[0.06em] text-[11px]">Total</span>
                <span className="font-serif text-xl tabular-nums">{CURRENCY_SYMBOLS[form.currency] || ''}{total.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </form>

        {/* Live preview */}
        <div className={`lg:sticky lg:top-4 lg:self-start ${previewOpen ? 'block' : 'hidden lg:block'}`}>
          <Card className="!p-3 bg-[#f5f5f7] dark:!bg-[rgba(0,0,0,0.2)]">
            <p className="text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-400 mb-2 px-1">Live Preview · A4</p>
            <InvoiceA4Frame>
              <InvoiceTemplate templateId={templateId} data={previewData} />
            </InvoiceA4Frame>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-300">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 rounded border border-dark-600 dark:border-[rgba(255,255,255,0.08)] cursor-pointer bg-transparent"
        />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-[7px] text-[12px] font-display rounded text-dark-100 bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] focus:outline-none focus:border-accent/50 transition-colors tabular-nums"
        />
      </div>
    </div>
  )
}
