'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchQuery } from '@/components/layout/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Plus, Search, Trash2, Send, Eye, DollarSign, X, ChevronDown } from 'lucide-react'
import { formatCurrencyWith, formatDate, CURRENCIES } from '@/lib/utils'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: '₵',
  KES: 'KSh', ZAR: 'R', CAD: 'C$', AUD: 'A$', JPY: '¥', CHF: 'Fr', INR: '₹',
}
import Link from 'next/link'
import type { Invoice, Client, Project } from '@/types'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

export function InvoicesClientPage({ initialInvoices, initialClients, initialProjects }: {
  initialInvoices: Invoice[]
  initialClients: Client[]
  initialProjects: Project[]
}) {
  const router = useRouter()
  const { query: globalQuery } = useSearchQuery()
  const [invoices, setInvoices] = useState(initialInvoices)
  const [clients, setClients] = useState(initialClients)
  const [projects, setProjects] = useState(initialProjects)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sending, setSending] = useState<number | null>(null)
  const [form, setForm] = useState({
    client_name: '', client_email: '', project_name: '', status: 'draft',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '', tax_rate: '0', notes: '', sender_email: '', currency: 'USD',
  })
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit_price: 0 }])
  const [clientSuggestions, setClientSuggestions] = useState<Client[]>([])
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)

  useEffect(() => { setSearch(globalQuery) }, [globalQuery])

  const load = useCallback(async () => {
    const [iRes, cRes, pRes] = await Promise.all([fetch('/api/invoices'), fetch('/api/clients'), fetch('/api/projects')])
    if (iRes.ok) setInvoices(await iRes.json())
    if (cRes.ok) setClients(await cRes.json())
    if (pRes.ok) setProjects(await pRes.json())
    router.refresh()
  }, [router])

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const taxAmount = subtotal * (Number(form.tax_rate) / 100)
  const total = subtotal + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
        items: items.filter((i) => i.description || i.unit_price > 0),
      }),
    })
    setShowModal(false)
    setItems([{ description: '', quantity: 1, unit_price: 0 }])
    load()
  }

  const handleSend = async (id: number) => {
    setSending(id)
    try {
      const res = await fetch(`/api/invoices/${id}/send`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) { alert(data.message); load() }
      else alert(`Error: ${data.error}`)
    } finally { setSending(null) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this invoice?')) return
    await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' })
    load()
  }

  const markPaid = async (invoice: Invoice) => {
    await fetch('/api/invoices', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...invoice, status: 'paid', paid_date: new Date().toISOString().split('T')[0], items: [] }),
    })
    load()
  }

  const openNew = () => {
    setForm({ client_name: '', client_email: '', project_name: '', status: 'draft', issue_date: new Date().toISOString().split('T')[0], due_date: '', tax_rate: '0', notes: '', sender_email: '', currency: 'USD' })
    setItems([{ description: '', quantity: 1, unit_price: 0 }])
    setClientSuggestions([])
    setShowModal(true)
  }

  const handleClientInput = (value: string) => {
    setForm({ ...form, client_name: value })
    const matches = clients.filter(c => c.name.toLowerCase().includes(value.toLowerCase()))
    setClientSuggestions(value.length > 0 ? matches : [])
    setShowClientSuggestions(value.length > 0)
  }

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items]
    updated[idx] = { ...updated[idx], [field]: value }
    setItems(updated)
  }

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.invoice_number.toLowerCase().includes(search.toLowerCase()) || (inv.client_name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusTotals = {
    draft: invoices.filter((i) => i.status === 'draft').reduce((s, i) => s + i.total, 0),
    sent: invoices.filter((i) => i.status === 'sent').reduce((s, i) => s + i.total, 0),
    paid: invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    overdue: invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.total, 0),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Draft', value: statusTotals.draft, color: 'text-zinc-400' },
          { label: 'Sent', value: statusTotals.sent, color: 'text-blue-400' },
          { label: 'Paid', value: statusTotals.paid, color: 'text-accent' },
          { label: 'Overdue', value: statusTotals.overdue, color: 'text-red-500' },
        ].map((s) => (
          <Card key={s.label} className="!p-4">
            <p className="text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-400 mb-1">{s.label}</p>
            <p className={`font-serif text-xl font-normal ${s.color}`}>{formatCurrencyWith(s.value, 'USD')}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input type="text" placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded pl-9 pr-4 py-[7px] text-[13px] font-display text-dark-100 placeholder:text-dark-400 focus:outline-none focus:border-accent/50 transition-colors duration-200 w-full sm:w-64"
            />
          </div>
          <Select options={[{ value: 'all', label: 'All' }, { value: 'draft', label: 'Draft' }, { value: 'sent', label: 'Sent' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }]}
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-32" />
        </div>
        <Button onClick={openNew} className="w-full sm:w-auto"><Plus size={16} /> Create Invoice</Button>
      </div>

      {filtered.length === 0 ? (
        <button type="button" onClick={openNew} className="w-full text-left group cursor-pointer">
          <div className="flex items-end justify-between px-6 py-8 rounded-md bg-accent group-hover:bg-accent-hover transition-all duration-300 group-hover:-translate-y-0.5">
            <div>
              <span className="text-[9px] font-display font-semibold uppercase tracking-[0.14em] text-white/50 block mb-3">{search || filterStatus !== 'all' ? 'No Matches' : 'Get Started'}</span>
              <span className="font-serif text-[1.25rem] font-normal text-white leading-snug">{search || filterStatus !== 'all' ? 'No invoices match your filters.' : 'Create your first invoice.'}</span>
            </div>
            {!search && filterStatus === 'all' && <Plus size={22} className="text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0 ml-4" />}
          </div>
        </button>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <Card key={inv.id} className="!p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-black/[0.10] dark:hover:border-white/[0.15] transition-colors">
              <div className="min-w-0">
                <Link href={`/invoices/${inv.id}`} className="font-medium text-dark-100 hover:text-accent transition-colors">{inv.invoice_number}</Link>
                <p className="text-xs text-dark-400 truncate mt-0.5">{inv.client_name} &middot; {formatDate(inv.issue_date)}</p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-left sm:text-right">
                  <p className="font-serif text-base text-dark-100">{formatCurrencyWith(inv.total, inv.currency || 'USD')}</p>
                  <Badge variant={inv.status}>{inv.status}</Badge>
                </div>
                <div className="flex gap-1">
                  <Link href={`/invoices/${inv.id}`} className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-dark-400 hover:text-dark-100 transition-colors"><Eye size={16} /></Link>
                  {inv.status === 'draft' && <button onClick={() => handleSend(inv.id)} disabled={sending === inv.id} className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-dark-400 hover:text-blue-400 transition-colors cursor-pointer disabled:opacity-50"><Send size={16} /></button>}
                  {(inv.status === 'sent' || inv.status === 'overdue') && <button onClick={() => markPaid(inv)} className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-dark-400 hover:text-accent transition-colors cursor-pointer"><DollarSign size={16} /></button>}
                  <button onClick={() => handleDelete(inv.id)} className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-dark-400 hover:text-red-500 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Invoice" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Client — typeahead, creates if new */}
            <div className="relative">
              <Input
                label="Client *"
                value={form.client_name}
                onChange={(e) => handleClientInput(e.target.value)}
                onBlur={() => setTimeout(() => setShowClientSuggestions(false), 150)}
                placeholder="Type or enter new name"
                required
                autoComplete="off"
              />
              {showClientSuggestions && clientSuggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border border-[#E2DDD8] dark:border-[rgba(255,255,255,0.10)] bg-[#FDFCFA] dark:bg-[#0a0f0b] shadow-lg overflow-hidden">
                  {clientSuggestions.map(c => (
                    <button key={c.id} type="button"
                      onMouseDown={() => { setForm({ ...form, client_name: c.name }); setShowClientSuggestions(false) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    >
                      {c.name}
                      {c.company && <span className="text-xs text-[var(--text-muted)] ml-2">{c.company}</span>}
                    </button>
                  ))}
                </div>
              )}
              {form.client_name && !clients.find(c => c.name.toLowerCase() === form.client_name.toLowerCase()) && (
                <div className="mt-2 space-y-1">
                  <Input
                    label="Client email"
                    type="email"
                    value={form.client_email}
                    onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                    placeholder="client@example.com"
                    autoComplete="off"
                  />
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">New client will be created</p>
                </div>
              )}
            </div>
            {/* Project — optional, creates if new */}
            <div>
              <Input
                label="Project (optional)"
                value={form.project_name}
                onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                placeholder="Type or leave blank"
                autoComplete="off"
              />
              {form.project_name && !projects.find(p => p.name.toLowerCase() === form.project_name.toLowerCase()) && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">New project will be created</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Issue Date *" type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} required />
            <Input label="Due Date *" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
            <div>
              <label className="block text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-300 mb-1.5">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded px-3 py-[7px] text-[13px] font-display text-dark-100 focus:outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.label.split('—')[1]?.trim()}</option>
                ))}
              </select>
            </div>
            <Input label="Tax Rate (%)" type="number" min="0" max="100" step="0.1" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-300 mb-2">Line Items</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded p-3 space-y-2">
                  {/* Description — full width */}
                  <input placeholder="Description (optional)" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="w-full bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded px-3 py-[7px] text-[13px] font-display text-dark-100 placeholder:text-dark-400 focus:outline-none focus:border-accent/50 transition-colors" />
                  {/* Qty + Price + Delete */}
                  <div className="flex gap-2 items-center">
                    <input type="number" placeholder="Qty" min="1"
                      value={item.quantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      className="w-16 bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded px-2 py-[7px] text-[13px] font-display text-dark-100 focus:outline-none focus:border-accent/50 transition-colors" />
                    <div className="flex items-stretch flex-1 min-w-0">
                      <span className="flex items-center px-2 text-[11px] font-display text-dark-400 bg-[#F5F3F0] dark:bg-[rgba(255,255,255,0.02)] border border-r-0 border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded-l select-none flex-shrink-0">
                        {CURRENCY_SYMBOLS[form.currency] || form.currency}
                      </span>
                      <input type="number" placeholder="0.00" min="0" step="0.01"
                        value={item.unit_price || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                        className="flex-1 min-w-0 bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded-r px-3 py-[7px] text-[13px] font-display text-dark-100 focus:outline-none focus:border-accent/50 transition-colors" />
                    </div>
                    {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="p-1.5 text-dark-400 hover:text-red-500 cursor-pointer flex-shrink-0"><X size={15} /></button>}
                  </div>
                  <div className="flex justify-end">
                    <span className="text-xs text-dark-400 tabular-nums">{formatCurrencyWith(item.quantity * item.unit_price, form.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={addItem} className="mt-2"><Plus size={14} /> Add Item</Button>
          </div>
          <div className="border border-dark-600 dark:border-[rgba(255,255,255,0.08)] p-4 space-y-2 text-sm">
            <div className="flex justify-between text-dark-300"><span>Subtotal</span><span>{formatCurrencyWith(subtotal, form.currency)}</span></div>
            <div className="flex justify-between text-dark-300"><span>Tax ({form.tax_rate}%)</span><span>{formatCurrencyWith(taxAmount, form.currency)}</span></div>
            <div className="flex justify-between text-dark-100 pt-2 border-t border-dark-600 dark:border-[rgba(255,255,255,0.08)]">
              <span className="font-display font-semibold uppercase tracking-[0.06em] text-[11px]">Total</span>
              <span className="font-serif text-lg">{formatCurrencyWith(total, form.currency)}</span>
            </div>
          </div>
          <Input label="Your email (optional)" type="email" value={form.sender_email} onChange={(e) => setForm({ ...form, sender_email: e.target.value })} placeholder="yourname@example.com — clients will reply to this address" />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Payment terms, additional info..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Create Invoice</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
