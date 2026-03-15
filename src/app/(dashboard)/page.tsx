import { getDb, initDb } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  FolderKanban,
  FileText,
  DollarSign,
  ArrowRight,
  Plus,
  Wand2,
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

// Stat card — neumorphic in light, glow-glass in dark
function StatCard({
  value, label, href, icon: Icon, iconBg, iconGlowClass, delay,
}: {
  value: string | number
  label: string
  href: string
  icon: React.ElementType
  iconBg: string
  iconGlowClass: string
  delay: string
}) {
  return (
    <Link
      href={href}
      className="group block"
      style={{ animation: `stagger 0.45s cubic-bezier(0.16,1,0.3,1) ${delay} both` }}
    >
      <div className="glass rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        {/* Icon circle */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${iconBg} ${iconGlowClass} transition-all duration-300`}
        >
          <Icon size={20} className="text-white drop-shadow-sm" />
        </div>
        {/* Number */}
        <div>
          <p className="font-display font-bold text-dark-100 text-3xl tracking-tight tabular-nums leading-none group-hover:text-accent transition-colors duration-200">
            {value}
          </p>
          <p className="text-[11px] text-dark-400 mt-1.5 font-medium tracking-wide">{label}</p>
        </div>
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
    <div className="space-y-5 animate-fade-in">

      {/* ── Stat Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={stats.clientCount}
          label="Active Clients"
          href="/clients"
          icon={Users}
          iconBg="from-emerald-400 to-teal-500"
          iconGlowClass="icon-glow-green"
          delay="0.05s"
        />
        <StatCard
          value={stats.activeProjects}
          label="In Progress Projects"
          href="/projects"
          icon={FolderKanban}
          iconBg="from-cyan-400 to-sky-500"
          iconGlowClass="icon-glow-cyan"
          delay="0.10s"
        />
        <StatCard
          value={stats.pendingInvoices}
          label="Pending Invoices"
          href="/invoices"
          icon={FileText}
          iconBg="from-amber-400 to-orange-500"
          iconGlowClass="icon-glow-amber"
          delay="0.15s"
        />
        <StatCard
          value={formatCurrency(profit)}
          label="Net Profit"
          href="/finances"
          icon={DollarSign}
          iconBg={profitPositive ? 'from-teal-400 to-emerald-600' : 'from-red-400 to-rose-600'}
          iconGlowClass="icon-glow-teal"
          delay="0.20s"
        />
      </div>

      {/* ── Main content grid ────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 stagger-3">

        {/* Left col (2/3): Projects table + Invoices table */}
        <div className="xl:col-span-2 space-y-4">

          {/* Current Projects */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/30 dark:border-white/[0.07]">
              <p className="font-display font-bold text-dark-100 text-sm">Current Projects</p>
              <Link href="/projects" className="text-[11px] text-accent hover:text-accent-hover flex items-center gap-1 transition-colors font-medium">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            {stats.recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-5">
                <FolderKanban size={24} className="text-dark-400 mb-2" />
                <p className="text-dark-400 text-xs">No projects yet</p>
                <Link href="/projects" className="text-xs text-accent mt-2 hover:text-accent-hover transition-colors">Create your first &rarr;</Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 px-5 py-2.5 text-[10px] font-display font-bold uppercase tracking-widest text-dark-400">
                  <span>Project Name</span>
                  <span>Client</span>
                  <span>Status</span>
                </div>
                <div className="divide-y divide-white/20 dark:divide-white/[0.05]">
                  {stats.recentProjects.map((project) => (
                    <Link
                      key={project.id as number}
                      href={`/projects/${project.id}`}
                      className="grid grid-cols-3 items-center px-5 py-3 hover:bg-white/25 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <p className="text-sm font-medium text-dark-100 truncate pr-2">{project.name as string}</p>
                      <p className="text-xs text-dark-400 truncate pr-2">{project.client_name as string || '—'}</p>
                      <Badge variant={project.status as string}>{(project.status as string).replace('_', ' ')}</Badge>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/30 dark:border-white/[0.07]">
              <p className="font-display font-bold text-dark-100 text-sm">Recent Invoices</p>
              <Link href="/invoices" className="text-[11px] text-accent hover:text-accent-hover flex items-center gap-1 transition-colors font-medium">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            {stats.recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-5">
                <FileText size={24} className="text-dark-400 mb-2" />
                <p className="text-dark-400 text-xs">No invoices yet</p>
                <Link href="/invoices" className="text-xs text-accent mt-2 hover:text-accent-hover transition-colors">Create your first &rarr;</Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 px-5 py-2.5 text-[10px] font-display font-bold uppercase tracking-widest text-dark-400">
                  <span className="col-span-2">Invoice</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Status</span>
                </div>
                <div className="divide-y divide-white/20 dark:divide-white/[0.05]">
                  {stats.recentInvoices.map((inv) => (
                    <Link
                      key={inv.id as number}
                      href={`/invoices/${inv.id}`}
                      className="grid grid-cols-4 items-center px-5 py-3 hover:bg-white/25 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="col-span-2 min-w-0">
                        <p className="text-sm font-medium text-dark-100 tabular-nums">{inv.invoice_number as string}</p>
                        <p className="text-[11px] text-dark-400 truncate">{inv.client_name as string || '—'}</p>
                      </div>
                      <p className="text-sm font-semibold text-dark-100 tabular-nums text-right">{formatCurrency(inv.total as number)}</p>
                      <div className="flex justify-end">
                        <Badge variant={inv.status as string}>{inv.status as string}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Financial Overview */}
          <div className="glass rounded-2xl p-5 stagger-5">
            <p className="font-display font-bold text-dark-100 text-sm mb-4">Financial Overview</p>
            <div className="flex items-center gap-8 flex-wrap mb-4">
              <div>
                <p className="text-[10px] text-dark-400 uppercase tracking-widest mb-1">Revenue</p>
                <p className="font-display font-bold text-dark-100 text-lg tabular-nums">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-[10px] text-dark-400 uppercase tracking-widest mb-1">Expenses</p>
                <p className="font-display font-bold text-dark-100 text-lg tabular-nums">{formatCurrency(stats.totalExpenses)}</p>
              </div>
              <div>
                <p className="text-[10px] text-dark-400 uppercase tracking-widest mb-1">Net Profit</p>
                <p className={`font-display font-bold text-lg tabular-nums ${profitPositive ? 'text-accent' : 'text-red-500'}`}>
                  {formatCurrency(profit)}
                </p>
              </div>
            </div>
            <div className="neuro-inset p-1">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-accent to-teal-400 transition-all duration-1000 shadow-sm"
                style={{ width: `${revenueBarWidth}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-dark-400 mt-1.5 uppercase tracking-widest">
              <span>Revenue</span>
              <span>Expenses</span>
            </div>
          </div>
        </div>

        {/* Right col (1/3): Quick Actions + Brand Builder promo */}
        <div className="space-y-4 stagger-4">

          {/* Quick Actions */}
          <div className="glass rounded-2xl p-5">
            <p className="font-display font-bold text-dark-100 text-sm mb-4">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: '/clients',       label: 'Add Client',      icon: Users,       bg: 'bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
                { href: '/projects',      label: 'New Project',     icon: FolderKanban, bg: 'bg-cyan-500/10 dark:bg-cyan-500/15 hover:bg-cyan-500/20',           text: 'text-cyan-700 dark:text-cyan-300' },
                { href: '/invoices',      label: 'Create Invoice',  icon: FileText,    bg: 'bg-amber-500/10 dark:bg-amber-500/15 hover:bg-amber-500/20',         text: 'text-amber-700 dark:text-amber-300' },
                { href: '/tools/brief',   label: 'Brand Builder',   icon: Wand2,       bg: 'bg-violet-500/10 dark:bg-violet-500/15 hover:bg-violet-500/20',      text: 'text-violet-700 dark:text-violet-300' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex flex-col items-start gap-3 p-4 rounded-xl ${action.bg} transition-all duration-200 group hover:-translate-y-0.5`}
                >
                  <action.icon size={16} className={action.text} />
                  <span className={`text-xs font-display font-semibold ${action.text} leading-tight flex items-center gap-1.5`}>
                    {action.label}
                    <Plus size={11} className="opacity-60" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Brand Builder promo card — with 3D decorative elements */}
          <Link href="/tools/brand-generator" className="block group">
            <div className="glass rounded-2xl p-5 relative overflow-hidden hover:-translate-y-0.5 transition-all duration-200">
              {/* 3D floating shapes */}
              <div className="absolute top-3 right-3 flex gap-2 pointer-events-none select-none" aria-hidden>
                <div className="shape-orb w-8 h-8 float-a opacity-60 dark:opacity-80" />
                <div className="shape-prism w-6 h-6 float-b opacity-40 dark:opacity-60" />
                <div className="shape-ring w-5 h-5 float-c opacity-50 dark:opacity-70" />
              </div>
              <div className="absolute bottom-2 right-2 pointer-events-none select-none" aria-hidden>
                <div className="shape-diamond w-7 h-7 float-b opacity-30 dark:opacity-50" />
              </div>

              <p className="text-[9px] font-display font-bold uppercase tracking-widest text-dark-400 mb-2">Design Tool</p>
              <p className="font-display font-bold text-dark-100 text-base leading-snug mb-3 max-w-[140px]">
                Build your brand identity
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-accent group-hover:text-accent-hover transition-colors">
                Open Builder
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>

          {/* Social Content promo card */}
          <Link href="/tools/social-content" className="block group">
            <div className="glass rounded-2xl p-5 relative overflow-hidden hover:-translate-y-0.5 transition-all duration-200">
              {/* 3D floating shapes */}
              <div className="absolute top-3 right-3 flex gap-2 pointer-events-none select-none" aria-hidden>
                <div className="shape-ring w-7 h-7 float-b opacity-40 dark:opacity-65 [border-color:rgba(99,102,241,0.4)]" style={{ borderColor: 'rgba(99,102,241,0.35)' }} />
                <div className="shape-orb w-5 h-5 float-a opacity-40 dark:opacity-60 [background:radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.2),transparent_60%),linear-gradient(135deg,rgba(99,102,241,0.4),rgba(168,85,247,0.15))]" />
              </div>

              <p className="text-[9px] font-display font-bold uppercase tracking-widest text-dark-400 mb-2">AI Tool</p>
              <p className="font-display font-bold text-dark-100 text-base leading-snug mb-3 max-w-[150px]">
                Generate social content
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-violet-600 dark:text-violet-400 group-hover:opacity-80 transition-opacity">
                Open Tool
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
