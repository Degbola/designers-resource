'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Plus, Search, Mail, Phone, Building2, Trash2, Edit2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { Client } from '@/types'

export default function ClientsPage() {
  const [clients, setClients] = useState<(Client & { project_count: number; total_paid: number })[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', address: '', status: 'lead' as string, notes: '',
  })

  const load = useCallback(async () => {
    const res = await fetch('/api/clients')
    setClients(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingClient ? 'PUT' : 'POST'
    const body = editingClient ? { ...form, id: editingClient.id, onboarding_step: editingClient.onboarding_step } : form
    await fetch('/api/clients', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowModal(false)
    setEditingClient(null)
    setForm({ name: '', email: '', phone: '', company: '', address: '', status: 'lead', notes: '' })
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this client and all their data?')) return
    await fetch(`/api/clients?id=${id}`, { method: 'DELETE' })
    load()
  }

  const openEdit = (client: Client) => {
    setEditingClient(client)
    setForm({ name: client.name, email: client.email, phone: client.phone, company: client.company, address: client.address, status: client.status, notes: client.notes })
    setShowModal(true)
  }

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-dark-700 border border-dark-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-accent/50 w-full sm:w-64"
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'lead', label: 'Lead' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'archived', label: 'Archived' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={() => { setEditingClient(null); setForm({ name: '', email: '', phone: '', company: '', address: '', status: 'lead', notes: '' }); setShowModal(true) }} className="w-full sm:w-auto">
          <Plus size={16} /> Add Client
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-dark-400">No clients found. Add your first client to get started!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Card key={client.id} className="hover:border-dark-500 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: client.avatar_color }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Link href={`/clients/${client.id}`} className="font-semibold text-white hover:text-accent transition-colors">
                      {client.name}
                    </Link>
                    <Badge variant={client.status} className="ml-2">{client.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(client)} className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors cursor-pointer"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(client.id)} className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-red-400 transition-colors cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </div>
              {client.company && <p className="text-sm text-dark-300 flex items-center gap-1.5 mb-1"><Building2 size={14} /> {client.company}</p>}
              {client.email && <p className="text-sm text-dark-300 flex items-center gap-1.5 mb-1"><Mail size={14} /> {client.email}</p>}
              {client.phone && <p className="text-sm text-dark-300 flex items-center gap-1.5 mb-1"><Phone size={14} /> {client.phone}</p>}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-dark-600 text-xs text-dark-400">
                <span>{client.project_count} project{client.project_count !== 1 ? 's' : ''}</span>
                <span>${(client.total_paid || 0).toLocaleString()} earned</span>
                <Link href={`/portal/${client.portal_token}`} className="flex items-center gap-1 text-accent hover:text-accent-hover" target="_blank"><ExternalLink size={12} /> Portal</Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingClient ? 'Edit Client' : 'Add New Client'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: 'lead', label: 'Lead' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editingClient ? 'Update' : 'Create'} Client</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
