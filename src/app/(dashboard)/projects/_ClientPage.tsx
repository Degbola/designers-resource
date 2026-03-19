'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Plus, Search, Trash2, Edit2, Calendar, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Project, Client } from '@/types'

const statusColumns = [
  { id: 'not_started', label: 'Not Started', color: 'border-zinc-500' },
  { id: 'in_progress', label: 'In Progress', color: 'border-blue-500' },
  { id: 'review', label: 'Review', color: 'border-purple-500' },
  { id: 'completed', label: 'Completed', color: 'border-green-500' },
]

export function ProjectsClientPage({ initialProjects, initialClients }: { initialProjects: Project[]; initialClients: Client[] }) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [clients, setClients] = useState(initialClients)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    client_id: '', name: '', description: '', status: 'not_started', priority: 'medium',
    start_date: '', due_date: '', budget: '', progress: '0', drive_folder_url: '',
  })

  const load = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([fetch('/api/projects'), fetch('/api/clients')])
    if (pRes.ok) setProjects(await pRes.json())
    if (cRes.ok) setClients(await cRes.json())
    router.refresh()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = { ...form, client_id: Number(form.client_id), budget: Number(form.budget) || 0, progress: Number(form.progress) || 0, ...(editing ? { id: editing.id } : {}) }
    await fetch('/api/projects', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowModal(false)
    setEditing(null)
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this project?')) return
    await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
    load()
  }

  const openEdit = (p: Project) => {
    setEditing(p)
    setForm({ client_id: String(p.client_id), name: p.name, description: p.description, status: p.status, priority: p.priority, start_date: p.start_date, due_date: p.due_date, budget: String(p.budget), progress: String(p.progress), drive_folder_url: (p as Project & { drive_folder_url?: string }).drive_folder_url || '' })
    setShowModal(true)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ client_id: clients[0]?.id?.toString() || '', name: '', description: '', status: 'not_started', priority: 'medium', start_date: '', due_date: '', budget: '', progress: '0', drive_folder_url: '' })
    setShowModal(true)
  }

  const updateStatus = async (project: Project, newStatus: string) => {
    await fetch('/api/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...project, status: newStatus }),
    })
    load()
  }

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.client_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded pl-9 pr-4 py-[7px] text-[13px] font-display text-dark-100 placeholder:text-dark-400 focus:outline-none focus:border-accent/50 transition-colors duration-200 w-full sm:w-64"
          />
        </div>
        <Button onClick={openNew} className="w-full sm:w-auto">
          <Plus size={16} /> New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((col) => {
          const colProjects = filtered.filter((p) => p.status === col.id)
          return (
            <div key={col.id}>
              <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${col.color}`}>
                <h3 className="font-display font-semibold text-[11px] uppercase tracking-[0.06em] text-dark-200">{col.label}</h3>
                <span className="text-[10px] font-display text-dark-400">{colProjects.length}</span>
              </div>
              <div className="space-y-3">
                {colProjects.map((project) => (
                  <Card key={project.id} className="!p-4 hover:border-black/[0.10] dark:hover:border-white/[0.15] transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/projects/${project.id}`} className="font-medium text-dark-100 text-sm hover:text-accent transition-colors">{project.name}</Link>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(project)} className="p-1 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-dark-400 hover:text-dark-100 cursor-pointer"><Edit2 size={12} /></button>
                        <button onClick={() => handleDelete(project.id)} className="p-1 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-dark-400 hover:text-red-500 cursor-pointer"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <p className="text-xs text-dark-400 mb-2">{project.client_name}</p>
                    <Badge variant={project.priority} className="mb-2">{project.priority}</Badge>
                    {project.due_date && (
                      <p className="text-xs text-dark-300 flex items-center gap-1 mt-2"><Calendar size={12} /> {formatDate(project.due_date)}</p>
                    )}
                    {project.budget > 0 && (
                      <p className="text-xs text-dark-300 flex items-center gap-1"><DollarSign size={12} /> {formatCurrency(project.budget)}</p>
                    )}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-dark-400 mb-1"><span>Progress</span><span>{project.progress}%</span></div>
                      <div className="h-1.5 bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden">
                        <div className="h-full bg-accent transition-all" style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                    {project.status !== 'completed' && (
                      <div className="flex gap-1 mt-3">
                        {statusColumns.filter((s) => s.id !== project.status).map((s) => (
                          <button key={s.id} onClick={() => updateStatus(project, s.id)}
                            className="text-[10px] px-2 py-1 bg-black/[0.04] dark:bg-white/[0.04] text-dark-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] hover:text-dark-100 transition-colors cursor-pointer font-display">
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
                {colProjects.length === 0 && (
                  <button type="button" onClick={openNew} className="w-full text-left group cursor-pointer">
                    <div className="px-4 py-5 rounded-md border border-dashed border-dark-600 dark:border-[rgba(255,255,255,0.08)] hover:border-accent/50 hover:bg-dark-700 transition-all duration-200">
                      <span className="text-[9px] font-display font-semibold uppercase tracking-[0.12em] text-dark-400 block mb-1.5">Empty</span>
                      <span className="font-serif text-sm font-normal text-dark-300 italic group-hover:text-accent transition-colors">Add a project here.</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Project' : 'New Project'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Project Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select label="Client *" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} options={clients.map((c) => ({ value: String(c.id), label: c.name }))} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusColumns.map((s) => ({ value: s.id, label: s.label }))} />
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input label="Due Date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Budget ($)" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            <Input label="Progress (%)" type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} />
          </div>
          <Input label="Google Drive Folder URL" type="url" placeholder="https://drive.google.com/drive/folders/..." value={form.drive_folder_url} onChange={(e) => setForm({ ...form, drive_folder_url: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'} Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
