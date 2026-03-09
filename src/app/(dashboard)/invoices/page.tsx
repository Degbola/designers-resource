'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Plus, Search, Trash2, Send, Eye, DollarSign, X } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Invoice, Client, Project } from '@/types'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sending, setSending] = useState<number | null>(null)
  const [form, setForm] = useState({
    client_id: '', project_id: '', status: 'draft', issue_date: new Date().toISOString().split('T')[0],
    due_date: '', tax_rate: '0', notes: '',
  })
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit_price: 0 }])

  const load = useCallback(async () => {
    const [iRes, cRes, pRes] = await Promise.all([fetch('/api/invoices'), fetch('/api/clients'), fetch('/api/projects')])
    setInvoices(await iRes.json())
    setClients(await cRes.json())
    setProjects(await pRes.json())
  }, [])

  useEffect(() => { load() }, [load])

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const taxAmount = subtotal * (Number(form.tax_rate) / 100)
  const total = subtotal + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Number(form.client_id),
        project_id: form.project_id ? Number(form.project_id) : null,
        status: form.status,
        issue_date: form.issue_date,
        due_date: form.due_date,
        tax_rate: Number(form.tax_rate),
        notes: form.notes,
        items: items.filter((i) => i.description),
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
      if (res.ok) {
        alert(data.message)
        load()
      } else {
        alert(`Error: ${data.error}`)
      }
    } finally {
      setSending(null)
    }
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
      body: JSON.stringify({
        ...invoice,
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        items: [],
      }),
    })
    load()
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
          { label: 'Paid', value: statusTotals.paid, color: 'text-green-400' },
          { label: 'Overdue', value: statusTotals.overdue, color: 'text-red-400' },
        ].map((s) => (
          <Card key={s.label} className="!p-4">
            <p className="text-xs text-dark-400">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input type="text" placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-dark-700 border border-dark-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-accent/50 w-full sm:w-64" />
          </div>
          <Select options={[{ value: 'all', label: 'All' }, { value: 'draft', label: 'Draft' }, { value: 'sent', label: 'Sent' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }]} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-32" />
        </div>
        <Button onClick={() => { setForm({ client_id: clients[0]?.id?.toString() || '', project_id: '', status: 'draft', issue_date: new Date().toISOString().split('T')[0], due_date: '', tax_rate: '0', notes: '' }); setItems([{ description: '', quantity: 1, unit_price: 0 }]); setShowModal(true) }} className="w-full sm:w-auto">
          <Plus size={16} /> Create Invoice
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12"><p className="text-dark-400">No invoices found</p></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <Card key={inv.id} className="!p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-dark-500 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-2 rounded-lg bg-dark-700 flex-shrink-0"><DollarSign size={20} className="text-accent" /></div>
                <div className="min-w-0">
                  <Link href={`/invoices/${inv.id}`} className="font-medium text-white hover:text-accent transition-colors">{inv.invoice_number}</Link>
                  <p className="text-xs text-dark-400 truncate">{inv.client_name} &middot; {formatDate(inv.issue_date)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-left sm:text-right">
                  <p className="font-semibold text-white">{formatCurrency(inv.total)}</p>
                  <Badge variant={inv.status}>{inv.status}</Badge>
                </div>
                <div className="flex gap-1">
                  <Link href={`/invoices/${inv.id}`} className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"><Eye size={16} /></Link>
                  {inv.status === 'draft' && (
                    <button onClick={() => handleSend(inv.id)} disabled={sending === inv.id} className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-blue-400 transition-colors cursor-pointer disabled:opacity-50"><Send size={16} /></button>
                  )}
                  {(inv.status === 'sent' || inv.status === 'overdue') && (
                    <button onClick={() => markPaid(inv)} className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-green-400 transition-colors cursor-pointer"><DollarSign size={16} /></button>
                  )}
                  <button onClick={() => handleDelete(inv.id)} className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-red-400 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Invoice" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Client *" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} options={clients.map((c) => ({ value: String(c.id), label: c.name }))} />
            <Select label="Project" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} options={[{ value: '', label: 'None' }, ...projects.filter((p) => !form.client_id || p.client_id === Number(form.client_id)).map((p) => ({ value: String(p.id), label: p.name }))]} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Issue Date *" type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} required />
            <Input label="Due Date *" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
            <Input label="Tax Rate (%)" type="number" min="0" max="100" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Line Items</label>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="space-y-2 sm:space-y-0 sm:flex sm:gap-2 sm:items-start bg-dark-700/30 sm:bg-transparent rounded-lg p-3 sm:p-0">
                  <input placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="w-full sm:flex-1 bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-accent/50" />
                  <div className="flex gap-2 items-center">
                    <input type="number" placeholder="Qty" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      className="w-20 bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50" />
                    <input type="number" placeholder="Price" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                      className="flex-1 sm:w-28 sm:flex-none bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50" />
                    <span className="w-24 py-2 text-sm text-dark-200 text-right flex-shrink-0">{formatCurrency(item.quantity * item.unit_price)}</span>
                    {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="p-2 text-dark-400 hover:text-red-400 cursor-pointer flex-shrink-0"><X size={16} /></button>}
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={addItem} className="mt-2"><Plus size={14} /> Add Item</Button>
          </div>

          <div className="bg-dark-700/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between text-dark-300"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-dark-300"><span>Tax ({form.tax_rate}%)</span><span>{formatCurrency(taxAmount)}</span></div>
            <div className="flex justify-between font-bold text-white text-lg border-t border-dark-600 pt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>

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
