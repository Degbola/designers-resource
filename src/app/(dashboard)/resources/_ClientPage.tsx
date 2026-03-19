'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchQuery } from '@/components/layout/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import {
  Plus, Search, Star, ExternalLink, Edit2, Trash2,
  Wrench, Sparkles, Type, Palette, Shapes, Image, GraduationCap
} from 'lucide-react'
import type { Resource } from '@/types'
import type { LucideIcon } from 'lucide-react'

const CATEGORY_CONFIG: Record<string, { icon: LucideIcon; label: string }> = {
  tools: { icon: Wrench, label: 'Tools' },
  inspiration: { icon: Sparkles, label: 'Inspiration' },
  fonts: { icon: Type, label: 'Fonts' },
  colors: { icon: Palette, label: 'Colors' },
  icons: { icon: Shapes, label: 'Icons' },
  stock: { icon: Image, label: 'Stock' },
  learning: { icon: GraduationCap, label: 'Learning' },
}

export function ResourcesClientPage({ initialResources }: { initialResources: Resource[] }) {
  const router = useRouter()
  const { query: globalQuery } = useSearchQuery()
  const [resources, setResources] = useState(initialResources)
  const [showModal, setShowModal] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [search, setSearch] = useState('')
  useEffect(() => { setSearch(globalQuery) }, [globalQuery])
  const [filterCategory, setFilterCategory] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', url: '', category: 'tools' as string, tags: '' })

  const load = useCallback(async () => {
    const res = await fetch('/api/resources')
    if (res.ok) setResources(await res.json())
    router.refresh()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingResource ? 'PUT' : 'POST'
    const body = editingResource ? { ...form, id: editingResource.id, is_favorite: editingResource.is_favorite } : form
    await fetch('/api/resources', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowModal(false)
    setEditingResource(null)
    setForm({ title: '', description: '', url: '', category: 'tools', tags: '' })
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this resource?')) return
    await fetch(`/api/resources?id=${id}`, { method: 'DELETE' })
    load()
  }

  const toggleFavorite = async (id: number) => {
    await fetch(`/api/resources/${id}/favorite`, { method: 'PATCH' })
    load()
  }

  const openEdit = (resource: Resource) => {
    setEditingResource(resource)
    setForm({ title: resource.title, description: resource.description, url: resource.url, category: resource.category, tags: resource.tags })
    setShowModal(true)
  }

  const openNew = () => {
    setEditingResource(null)
    setForm({ title: '', description: '', url: '', category: 'tools', tags: '' })
    setShowModal(true)
  }

  const filtered = resources.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()) || r.tags.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || r.category === filterCategory
    const matchFavorite = !showFavoritesOnly || r.is_favorite
    return matchSearch && matchCategory && matchFavorite
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input type="text" placeholder="Search resources..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded pl-9 pr-4 py-[7px] text-[13px] font-display text-dark-100 placeholder:text-dark-400 focus:outline-none focus:border-accent/50 transition-colors duration-200 w-full sm:w-64"
            />
          </div>
          <Select options={[{ value: 'all', label: 'All Categories' }, ...Object.entries(CATEGORY_CONFIG).map(([value, { label }]) => ({ value, label }))]}
            value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-44" />
          <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`p-[7px] border transition-colors cursor-pointer ${showFavoritesOnly ? 'border-accent/50 text-accent bg-dark-700' : 'border-dark-600 dark:border-[rgba(255,255,255,0.08)] text-dark-400 hover:text-dark-100 bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)]'}`}
            title="Show favorites only">
            <Star size={16} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
          </button>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Add Resource</Button>
      </div>

      {filtered.length === 0 ? (
        <button type="button" onClick={openNew} className="w-full text-left group cursor-pointer">
          <div className="flex items-end justify-between px-6 py-8 rounded-md bg-accent group-hover:bg-accent-hover transition-all duration-300 group-hover:-translate-y-0.5">
            <div>
              <span className="text-[9px] font-display font-semibold uppercase tracking-[0.14em] text-white/50 block mb-3">{search || filterCategory !== 'all' || showFavoritesOnly ? 'No Matches' : 'Get Started'}</span>
              <span className="font-serif text-[1.25rem] font-normal text-white leading-snug">{search || filterCategory !== 'all' || showFavoritesOnly ? 'No resources match your filters.' : 'Build your design library.'}</span>
            </div>
            {!search && filterCategory === 'all' && !showFavoritesOnly && <Plus size={22} className="text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0 ml-4" />}
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((resource) => {
            const config = CATEGORY_CONFIG[resource.category] || CATEGORY_CONFIG.tools
            const Icon = config.icon
            return (
              <Card key={resource.id} className="hover:border-black/[0.07] dark:hover:border-white/[0.08] transition-colors flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-display font-semibold uppercase tracking-[0.08em] text-dark-400"><Icon size={11} /> {config.label}</span>
                  <button onClick={() => toggleFavorite(resource.id)} className={`p-1 cursor-pointer transition-colors ${resource.is_favorite ? 'text-yellow-500' : 'text-dark-500 hover:text-yellow-500'}`}>
                    <Star size={15} fill={resource.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <h3 className="font-medium text-dark-100 mb-1 text-sm">{resource.title}</h3>
                {resource.description && <p className="text-sm text-dark-300 mb-3 line-clamp-2">{resource.description}</p>}
                {resource.tags && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {resource.tags.split(',').map((tag, i) => <span key={i} className="text-[10px] font-display border border-dark-600 dark:border-[rgba(255,255,255,0.08)] text-dark-400 px-1.5 py-0.5">{tag.trim()}</span>)}
                  </div>
                )}
                <div className="mt-auto pt-3 border-t border-dark-600 dark:border-[rgba(255,255,255,0.07)] flex items-center justify-between">
                  {resource.url ? <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"><ExternalLink size={14} /> Visit</a> : <span />}
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(resource)} className="p-1.5 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-dark-400 hover:text-dark-100 transition-colors cursor-pointer"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(resource.id)} className="p-1.5 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-dark-400 hover:text-red-500 transition-colors cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingResource ? 'Edit Resource' : 'Add Resource'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="URL" type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={Object.entries(CATEGORY_CONFIG).map(([value, { label }]) => ({ value, label }))} />
          </div>
          <Input label="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Comma-separated tags, e.g. design, prototyping" />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editingResource ? 'Update' : 'Add'} Resource</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
