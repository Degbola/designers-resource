import { getDb, initDb } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  FolderKanban,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

async function getStats() {
  await initDb()
  const db = getDb()
  const clientCount = ((await db.execute('SELECT COUNT(*) as c FROM clients')).rows[0] as unknown as { c: number }).c
  const activeProjects = ((await db.execute("SELECT COUNT(*) as c FROM projects WHERE status != 'completed'")).rows[0] as unknown as { c: number }).c
  const pendingInvoices = ((await db.execute("SELECT COUNT(*) as c FROM invoices WHERE status IN ('sent','draft')")).rows[0] as unknown as { c: number }).c
  const totalRevenue = ((await db.execute("SELECT COALESCE(SUM(amount),0) as t FROM income")).rows[0] as unknown as { t: number }).t
  const totalExpenses = ((await db.execute("SELECT COALESCE(SUM(amount),0) as t FROM expenses")).rows[0] as unknown as { t: number }).t
  const recentProjects = (await db.execute(`
    SELECT p.*, c.name as client_name FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    ORDER BY p.updated_at DESC LIMIT 5
  `)).rows as (Record<string, unknown>)[]
  const recentInvoices = (await db.execute(`
    SELECT i.*, c.name as client_name FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY i.created_at DESC LIMIT 5
  `)).rows as (Record<string, unknown>)[]

  return { clientCount, activeProjects, pendingInvoices, totalRevenue, totalExpenses, recentProjects, recentInvoices }
}

export default async function DashboardPage() {
  const stats = await getStats()
  const profit = stats.totalRevenue - stats.totalExpenses

  const statCards = [
    { label: 'Total Clients', value: stats.clientCount, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active Projects', value: stats.activeProjects, icon: FolderKanban, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Pending Invoices', value: stats.pendingInvoices, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Expenses', value: formatCurrency(stats.totalExpenses), icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Net Profit', value: formatCurrency(profit), icon: DollarSign, color: profit >= 0 ? 'text-green-400' : 'text-red-400', bg: profit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon size={24} className={stat.color} />
            </div>
            <div>
              <p className="text-sm text-dark-300">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Projects</h3>
            <Link href="/projects" className="text-sm text-accent hover:text-accent-hover">View all</Link>
          </div>
          {stats.recentProjects.length === 0 ? (
            <p className="text-dark-400 text-sm py-8 text-center">No projects yet. Create your first project!</p>
          ) : (
            <div className="space-y-3">
              {stats.recentProjects.map((project) => (
                <div key={project.id as number} className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50">
                  <div>
                    <p className="font-medium text-white text-sm">{project.name as string}</p>
                    <p className="text-xs text-dark-300">{project.client_name as string}</p>
                  </div>
                  <Badge variant={project.status as string}>{(project.status as string).replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Invoices</h3>
            <Link href="/invoices" className="text-sm text-accent hover:text-accent-hover">View all</Link>
          </div>
          {stats.recentInvoices.length === 0 ? (
            <p className="text-dark-400 text-sm py-8 text-center">No invoices yet. Create your first invoice!</p>
          ) : (
            <div className="space-y-3">
              {stats.recentInvoices.map((inv) => (
                <div key={inv.id as number} className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50">
                  <div>
                    <p className="font-medium text-white text-sm">{inv.invoice_number as string}</p>
                    <p className="text-xs text-dark-300">{inv.client_name as string}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white text-sm">{formatCurrency(inv.total as number)}</p>
                    <Badge variant={inv.status as string}>{inv.status as string}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/clients', label: 'Add Client', icon: Users, color: 'text-blue-400' },
            { href: '/projects', label: 'New Project', icon: FolderKanban, color: 'text-purple-400' },
            { href: '/invoices', label: 'Create Invoice', icon: FileText, color: 'text-amber-400' },
            { href: '/tools/colors', label: 'Color Palette', icon: Clock, color: 'text-green-400' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-700/50 hover:bg-dark-700 transition-colors border border-dark-600 hover:border-dark-500"
            >
              <action.icon size={24} className={action.color} />
              <span className="text-sm text-dark-200">{action.label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
