import { getDb, initDb } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  FolderKanban,
  FileText,
  ArrowRight,
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

function StatBlock({ value, label, href, index }: { value: string | number; label: string; href: string; index: number }) {
  return (
    <Link href={href} className={`group stagger-${index}`}>
      <div className="p-5 rounded-xl bg-dark-800 border border-dark-600/70 hover:border-dark-500 transition-all duration-200">
        <p className="font-display font-bold text-white text-3xl tracking-tight tabular-nums leading-none mb-2 group-hover:text-accent transition-colors">
          {value}
        </p>
        <p className="text-[10px] text-dark-400 uppercase tracking-widest font-medium">{label}</p>
      </div>
    </Link>
  )
}

export default async function DashboardPage() {
  const stats = await getStats()
  const profit = stats.totalRevenue - stats.totalExpenses
  const profitPositive = profit >= 0
  const revenueBarWidth = (stats.totalRevenue + stats.totalExpenses) > 0
    ? Math.min(100, Math.round((stats.totalRevenue / (stats.totalRevenue + stats.totalExpenses)) * 100))
    : 50

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock value={stats.clientCount} label="Clients" href="/clients" index={1} />
        <StatBlock value={stats.activeProjects} label="Active Projects" href="/projects" index={2} />
        <StatBlock value={stats.pendingInvoices} label="Pending Invoices" href="/invoices" index={3} />
        <StatBlock value={formatCurrency(profit)} label="Net Profit" href="/finances" index={4} />
      </div>

      {/* Financial Overview */}
      <div className="stagger-5">
        <Card className="!p-0 overflow-hidden">
          <div className="px-5 py-4">
            <p className="text-[10px] font-display font-bold tracking-[0.15em] uppercase text-dark-400 mb-3">Financial Overview</p>
            <div className="flex items-center gap-6 flex-wrap md:flex-nowrap">
              <div className="flex gap-6">
                <div>
                  <p className="text-[10px] text-dark-400 uppercase tracking-widest mb-0.5">Revenue</p>
                  <p className="font-display font-bold text-white tabular-nums">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-dark-400 uppercase tracking-widest mb-0.5">Expenses</p>
                  <p className="font-display font-bold text-white tabular-nums">{formatCurrency(stats.totalExpenses)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-dark-400 uppercase tracking-widest mb-0.5">Net Profit</p>
                  <p className={`font-display font-bold tabular-nums ${profitPositive ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(profit)}</p>
                </div>
              </div>
              <div className="flex-1 min-w-[120px]">
                <div className="h-1 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-1000"
                    style={{ width: `${revenueBarWidth}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-dark-600 mt-1 tracking-wider uppercase">
                  <span>Revenue</span>
                  <span>Expenses</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-6">
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-600/60">
            <p className="text-[10px] font-display font-bold tracking-[0.15em] uppercase text-dark-400">Recent Projects</p>
            <Link href="/projects" className="text-[10px] text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
              View all <ArrowRight size={10} />
            </Link>
          </div>
          {stats.recentProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-5">
              <FolderKanban size={24} className="text-dark-600 mb-2" />
              <p className="text-dark-500 text-xs">No projects yet</p>
              <Link href="/projects" className="text-xs text-accent mt-2 hover:text-accent-hover transition-colors">Create your first →</Link>
            </div>
          ) : (
            <div className="divide-y divide-dark-600/40">
              {stats.recentProjects.map((project) => (
                <div key={project.id as number} className="flex items-center justify-between px-5 py-3 hover:bg-dark-700/30 transition-colors">
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-medium text-white truncate">{project.name as string}</p>
                    <p className="text-[11px] text-dark-400 truncate">{project.client_name as string}</p>
                  </div>
                  <Badge variant={project.status as string}>{(project.status as string).replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-600/60">
            <p className="text-[10px] font-display font-bold tracking-[0.15em] uppercase text-dark-400">Recent Invoices</p>
            <Link href="/invoices" className="text-[10px] text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
              View all <ArrowRight size={10} />
            </Link>
          </div>
          {stats.recentInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-5">
              <FileText size={24} className="text-dark-600 mb-2" />
              <p className="text-dark-500 text-xs">No invoices yet</p>
              <Link href="/invoices" className="text-xs text-accent mt-2 hover:text-accent-hover transition-colors">Create your first →</Link>
            </div>
          ) : (
            <div className="divide-y divide-dark-600/40">
              {stats.recentInvoices.map((inv) => (
                <div key={inv.id as number} className="flex items-center justify-between px-5 py-3 hover:bg-dark-700/30 transition-colors">
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-medium text-white tabular-nums">{inv.invoice_number as string}</p>
                    <p className="text-[11px] text-dark-400 truncate">{inv.client_name as string}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white tabular-nums">{formatCurrency(inv.total as number)}</p>
                    <Badge variant={inv.status as string}>{inv.status as string}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-dark-600/60">
          <p className="text-[10px] font-display font-bold tracking-[0.15em] uppercase text-dark-400">Quick Actions</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-dark-600/40" style={{ borderTop: 'none' }}>
          {[
            { href: '/clients', label: 'Add Client', sub: 'Manage clients', icon: Users },
            { href: '/projects', label: 'New Project', sub: 'Track work', icon: FolderKanban },
            { href: '/invoices', label: 'Create Invoice', sub: 'Get paid faster', icon: FileText },
            { href: '/tools/brief', label: 'Brand Builder', sub: 'Design strategy', icon: Clock },
          ].map((action, i) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex flex-col gap-2.5 p-5 hover:bg-dark-700/40 transition-colors group border-dark-600/40 ${i > 0 ? 'border-l' : ''} ${i >= 2 ? 'border-t md:border-t-0' : ''}`}
            >
              <action.icon size={17} className="text-dark-500 group-hover:text-accent transition-colors" />
              <div>
                <p className="text-sm font-medium text-white group-hover:text-accent transition-colors leading-tight">{action.label}</p>
                <p className="text-[11px] text-dark-500 mt-0.5">{action.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
