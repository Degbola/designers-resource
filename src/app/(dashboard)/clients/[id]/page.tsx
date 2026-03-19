import { getDb } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Mail, Phone, Building2, MapPin, ArrowLeft, FolderKanban, FileText } from 'lucide-react'
import { PortalLink } from '@/components/clients/portal-link'
import { PortalMessages } from '@/components/clients/portal-messages'
import type { Client, Project, Invoice } from '@/types'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const client = await db.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first<Client>()
  if (!client) notFound()

  const projectsResult = await db.prepare('SELECT * FROM projects WHERE client_id = ? ORDER BY updated_at DESC').bind(id).all<Project>()
  const projects = projectsResult.results
  const invoicesResult = await db.prepare('SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC').bind(id).all<Invoice>()
  const invoices = invoicesResult.results

  return (
    <div className="space-y-6 animate-fade-in overflow-x-hidden">
      <Link href="/clients" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-dark-100 transition-colors">
        <ArrowLeft size={16} /> Back to Clients
      </Link>

      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-sm"
          style={{ backgroundColor: client.avatar_color }}
        >
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-dark-100">{client.name}</h2>
            <Badge variant={client.status}>{client.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-dark-300">
            {client.company && <span className="flex items-center gap-1.5"><Building2 size={14} /> {client.company}</span>}
            {client.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {client.email}</span>}
            {client.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {client.phone}</span>}
            {client.address && <span className="flex items-center gap-1.5"><MapPin size={14} /> {client.address}</span>}
          </div>
          {client.notes && <p className="mt-3 text-sm text-dark-300 bg-black/[0.05] dark:bg-white/[0.05] p-3 rounded-lg">{client.notes}</p>}
          <PortalLink token={client.portal_token} clientName={client.name} clientEmail={client.email} />
        </div>
      </div>

      <PortalMessages clientId={client.id} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark-100 flex items-center gap-2"><FolderKanban size={18} /> Projects ({projects.length})</h3>
            <Link href="/projects" className="text-sm text-accent hover:text-accent-hover">New Project</Link>
          </div>
          {projects.length === 0 ? (
            <p className="text-dark-400 text-sm text-center py-6">No projects yet</p>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between p-3 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">
                  <div>
                    <p className="font-medium text-dark-100 text-sm">{p.name}</p>
                    <p className="text-xs text-dark-400">{p.due_date ? `Due ${formatDate(p.due_date)}` : 'No due date'}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={p.status}>{p.status.replace('_', ' ')}</Badge>
                    {p.budget > 0 && <p className="text-xs text-dark-300 mt-1">{formatCurrency(p.budget)}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark-100 flex items-center gap-2"><FileText size={18} /> Invoices ({invoices.length})</h3>
            <Link href="/invoices" className="text-sm text-accent hover:text-accent-hover">New Invoice</Link>
          </div>
          {invoices.length === 0 ? (
            <p className="text-dark-400 text-sm text-center py-6">No invoices yet</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between p-3 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">
                  <div>
                    <p className="font-medium text-dark-100 text-sm">{inv.invoice_number}</p>
                    <p className="text-xs text-dark-400">{formatDate(inv.issue_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-dark-100 text-sm">{formatCurrency(inv.total)}</p>
                    <Badge variant={inv.status}>{inv.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
