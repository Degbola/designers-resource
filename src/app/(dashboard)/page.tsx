import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Money } from '@/components/ui/money'
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
import { Sparkline } from '@/components/ui/sparkline'

async function getStats(userId: number) {
  const db = getDb()
  const clientCountRow = await db.prepare('SELECT COUNT(*) as c FROM clients WHERE user_id = ?').bind(userId).first<{ c: number }>()
  const clientCount = clientCountRow?.c ?? 0
  const activeProjectsRow = await db.prepare("SELECT COUNT(*) as c FROM projects WHERE user_id = ? AND status != 'completed'").bind(userId).first<{ c: number }>()
  const activeProjects = activeProjectsRow?.c ?? 0
  const pendingInvoicesRow = await db.prepare("SELECT COUNT(*) as c FROM invoices WHERE user_id = ? AND status IN ('sent','draft')").bind(userId).first<{ c: number }>()
  const pendingInvoices = pendingInvoicesRow?.c ?? 0
  const totalRevenueRow = await db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM income WHERE user_id = ?").bind(userId).first<{ t: number }>()
  const totalRevenue = totalRevenueRow?.t ?? 0
  const totalExpensesRow = await db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE user_id = ?").bind(userId).first<{ t: number }>()
  const totalExpenses = totalExpensesRow?.t ?? 0
  const recentProjectsResult = await db.prepare(`
    SELECT p.*, c.name as client_name FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE p.user_id = ? ORDER BY p.updated_at DESC LIMIT 5
  `).bind(userId).all<Record<string, unknown>>()
  const recentProjects = recentProjectsResult.results
  const recentInvoicesResult = await db.prepare(`
    SELECT i.*, c.name as client_name FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.user_id = ? ORDER BY i.created_at DESC LIMIT 6
  `).bind(userId).all<Record<string, unknown>>()
  const recentInvoices = recentInvoicesResult.results

  let monthlyIncome: { month: string; income: number; expenses: number }[] = []
  try {
    const [incRes, expRes] = await Promise.all([
      db.prepare(`SELECT strftime('%Y-%m', date) as month, COALESCE(SUM(amount),0) as total FROM income WHERE user_id = ? GROUP BY month ORDER BY month ASC LIMIT 12`).bind(userId).all<{ month: string; total: number }>(),
      db.prepare(`SELECT strftime('%Y-%m', date) as month, COALESCE(SUM(amount),0) as total FROM expenses WHERE user_id = ? GROUP BY month ORDER BY month ASC LIMIT 12`).bind(userId).all<{ month: string; total: number }>(),
    ])
    const rawInc = (incRes.results || []).map((r) => ({ month: String(r.month), total: Number(r.total) }))
    const rawExp = (expRes.results || []).map((r) => ({ month: String(r.month), total: Number(r.total) }))
    const incMap = new Map(rawInc.map((r) => [r.month, r.total]))
    const expMap = new Map(rawExp.map((r) => [r.month, r.total]))
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const allMonths = [...new Set([...rawInc.map((r) => r.month), ...rawExp.map((r) => r.month)])].sort()
    const firstMonth = allMonths.length > 0 ? allMonths[0] : currentMonth
    const anchor = new Date(firstMonth + '-01')
    anchor.setMonth(anchor.getMonth() - 1)
    const cursor = new Date(anchor)
    const end = new Date(currentMonth + '-01')
    while (cursor <= end) {
      const m = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
      monthlyIncome.push({ month: m, income: incMap.get(m) ?? 0, expenses: expMap.get(m) ?? 0 })
      cursor.setMonth(cursor.getMonth() + 1)
    }
  } catch { /* non-critical — sparkline stays flat */ }

  return { clientCount, activeProjects, pendingInvoices, totalRevenue, totalExpenses, recentProjects, recentInvoices, monthlyIncome }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}


// Reusable green CTA card — same language as "Start New Project"
function CtaCard({ href, eyebrow, heading, icon: Icon }: {
  href: string
  eyebrow: string
  heading: React.ReactNode
  icon: React.ElementType
}) {
  return (
    <Link href={href} className="flex-1 flex flex-col group cursor-pointer">
      <div className="flex-1 bg-accent group-hover:bg-accent-hover flex flex-col justify-between p-5 min-h-[120px] transition-all duration-300 group-hover:-translate-y-0.5">
        <span className="text-[9px] font-display font-semibold uppercase tracking-[0.14em] text-white/50">
          {eyebrow}
        </span>
        <div className="flex items-end justify-between mt-4">
          <span className="font-serif text-[1.15rem] font-normal text-white leading-snug">
            {heading}
          </span>
          <Icon size={18} className="text-white/40 group-hover:text-white transition-all duration-300 group-hover:scale-110 flex-shrink-0 ml-3" />
        </div>
      </div>
    </Link>
  )
}

// Editorial dark CTA — for projects (visual contrast to green)
function DarkCtaCard({ href, eyebrow, heading, icon: Icon }: {
  href: string
  eyebrow: string
  heading: React.ReactNode
  icon: React.ElementType
}) {
  return (
    <Link href={href} className="block group cursor-pointer">
      <div
        className="flex items-center justify-between px-5 py-5 transition-all duration-300 group-hover:-translate-y-0.5"
        style={{ backgroundColor: '#1C1C1A' }}
      >
        <div>
          <span className="text-[9px] font-display font-semibold uppercase tracking-[0.14em] block mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {eyebrow}
          </span>
          <span className="font-serif text-[1.1rem] font-normal leading-snug block" style={{ color: 'rgba(255,255,255,0.90)' }}>
            {heading}
          </span>
        </div>
        <Icon size={20} className="flex-shrink-0 ml-4 transition-colors" style={{ color: 'rgba(255,255,255,0.25)' }} />
      </div>
    </Link>
  )
}

export default async function DashboardPage() {
  const user = await getSession()
  const stats = await getStats(user?.id ?? 0)
  const profit = stats.totalRevenue - stats.totalExpenses
  const profitPositive = profit >= 0
  const revenueBarWidth = (stats.totalRevenue + stats.totalExpenses) > 0
    ? Math.min(100, Math.round((stats.totalRevenue / (stats.totalRevenue + stats.totalExpenses)) * 100))
    : 50

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Editorial greeting ──────────────────────────── */}
      <header>
        <h1 className="font-serif text-4xl font-normal text-dark-100 leading-tight mb-1">
          {getGreeting()},{' '}
          <span className="italic text-accent">{firstName}.</span>
        </h1>
        <p className="text-[13px] text-dark-400 tracking-wide">
          Your studio at a glance.
        </p>
      </header>

      {/* ── Bento grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 xl:grid-rows-[auto_auto_auto] gap-5">

        {/* Revenue card — large (8 cols, 2 rows) */}
        <div className="glass xl:col-span-8 xl:row-span-2 p-6 flex flex-col reveal-1 hover:border-accent/40 transition-all duration-300 hover:-translate-y-0.5 group">
          <span className="text-[9px] font-display font-semibold uppercase tracking-[0.14em] text-dark-400 mb-5">
            Revenue · YTD
          </span>
          <div className="font-serif text-3xl sm:text-5xl font-normal text-dark-100 mb-auto tabular-nums">
            <Money amount={stats.totalRevenue} />
          </div>
          <div className="flex items-center gap-6 mt-4 mb-4">
            <div>
              <p className="text-[9px] font-display uppercase tracking-[0.12em] text-dark-400 mb-1">Expenses</p>
              <p className="font-display font-semibold text-dark-200 text-sm tabular-nums"><Money amount={stats.totalExpenses} /></p>
            </div>
            <div>
              <p className="text-[9px] font-display uppercase tracking-[0.12em] text-dark-400 mb-1">Net Profit</p>
              <p className={`font-display font-semibold text-sm tabular-nums ${profitPositive ? 'text-accent' : 'text-red-500'}`}>
                <Money amount={profit} />
              </p>
            </div>
          </div>
          {/* Revenue bar */}
          <div className="mb-4">
            <div className="neuro-inset h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-1000 rounded-full"
                style={{ width: `${revenueBarWidth}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] font-display uppercase tracking-[0.10em] text-dark-400 mt-1">
              <span>Revenue</span>
              <span>Expenses</span>
            </div>
          </div>
          {/* Sparkline */}
          <div className="h-[72px] w-full">
            <Sparkline data={stats.monthlyIncome} />
          </div>
        </div>

        {/* New Project CTA (4 cols) */}
        <Link href="/projects" className="xl:col-span-4 reveal-2">
          <div className="bg-accent hover:bg-accent-hover text-white p-6 flex flex-col justify-between h-full min-h-[130px] transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group">
            <span className="text-[9px] font-display font-semibold uppercase tracking-[0.14em] text-white/60">
              Quick action
            </span>
            <div className="flex items-end justify-between">
              <span className="font-serif text-xl font-normal leading-tight">
                Start New<br />Project
              </span>
              <Plus size={20} className="opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
            </div>
          </div>
        </Link>

        {/* Stats row — dashed border when value is 0 */}
        <div className="xl:col-span-4 grid grid-cols-3 xl:grid-cols-3 gap-3 reveal-3 pt-1 pb-1">
          {[
            { value: stats.clientCount,    label: 'Clients',  href: '/clients',  icon: Users },
            { value: stats.activeProjects, label: 'Projects', href: '/projects', icon: FolderKanban },
            { value: stats.pendingInvoices,label: 'Invoices', href: '/invoices', icon: FileText },
          ].map((stat) => (
            <Link
              key={stat.href}
              href={stat.href}
              className={[
                'p-4 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-0.5 group',
                stat.value === 0
                  ? 'border border-dashed border-dark-500/70 dark:border-[rgba(255,255,255,0.08)] hover:border-accent/50 hover:bg-dark-700 dark:hover:bg-[rgba(255,255,255,0.03)]'
                  : 'glass hover:border-accent/40 hover:bg-dark-700 dark:hover:bg-[rgba(255,255,255,0.03)]',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <stat.icon
                  size={13}
                  className={stat.value === 0 ? 'text-dark-400 group-hover:text-accent transition-colors' : 'text-dark-400 group-hover:text-accent transition-colors'}
                />
                {stat.value === 0 && (
                  <Plus size={10} className="text-dark-400 group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all" />
                )}
              </div>
              <div>
                <p className={[
                  'font-serif text-2xl font-normal tabular-nums leading-none',
                  stat.value === 0 ? 'text-dark-400' : 'text-dark-100',
                ].join(' ')}>
                  {stat.value}
                </p>
                <p className="text-[9px] font-display uppercase tracking-[0.10em] text-dark-400 mt-1">{stat.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Pending invoices — list when data exists, CTA card when empty */}
        <div className="glass xl:col-span-4 xl:row-span-2 flex flex-col reveal-2 hover:border-accent/40 transition-all duration-300 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <span className="text-[9px] font-display font-semibold uppercase tracking-[0.14em] text-dark-400">
              Pending Invoices
            </span>
            {stats.recentInvoices.length > 0 && (
              <Link href="/invoices" className="text-[9px] font-display uppercase tracking-[0.08em] text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
                View all <ArrowRight size={9} />
              </Link>
            )}
          </div>

          {stats.recentInvoices.length === 0 ? (
            <CtaCard
              href="/invoices"
              eyebrow="No invoices yet"
              heading={<>Create your<br />first invoice.</>}
              icon={Plus}
            />
          ) : (
            <div className="divide-y divide-dark-600 dark:divide-[rgba(255,255,255,0.05)] flex-1 px-6 pb-6">
              {stats.recentInvoices.map((inv) => (
                <Link
                  key={inv.id as number}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between py-3.5 hover:opacity-75 transition-opacity group"
                >
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-[12px] text-dark-100 truncate">{inv.client_name as string || '—'}</p>
                    <p className="text-[9px] font-display text-dark-400 mt-0.5">{inv.invoice_number as string}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                    <p className="font-display font-semibold text-[11px] text-dark-200 tabular-nums"><Money amount={inv.total as number} from={(inv.currency as string) || 'USD'} /></p>
                    <Badge variant={inv.status as string}>{inv.status as string}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Current projects — list when data, dark CTA when empty */}
        <div className="glass xl:col-span-8 flex flex-col reveal-3 hover:border-accent/40 transition-all duration-300 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <span className="text-[9px] font-display font-semibold uppercase tracking-[0.14em] text-dark-400">
              Current Projects
            </span>
            {stats.recentProjects.length > 0 && (
              <Link href="/projects" className="text-[9px] font-display uppercase tracking-[0.08em] text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
                View all <ArrowRight size={9} />
              </Link>
            )}
          </div>

          {stats.recentProjects.length === 0 ? (
            <DarkCtaCard
              href="/projects"
              eyebrow="No projects running"
              heading={<>Start your first<br />project.</>}
              icon={FolderKanban}
            />
          ) : (
            <div className="divide-y divide-dark-600 dark:divide-[rgba(255,255,255,0.05)] px-6 pb-6">
              {stats.recentProjects.map((project) => (
                <Link
                  key={project.id as number}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between py-3 hover:opacity-75 transition-opacity"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-[12px] text-dark-100 truncate">{project.name as string}</p>
                    <p className="text-[9px] font-display text-dark-400 mt-0.5">{project.client_name as string || '—'}</p>
                  </div>
                  <Badge variant={project.status as string}>{(project.status as string).replace('_', ' ')}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick access */}
        <div className="xl:col-span-4 reveal-4">
          <div className="glass p-6 hover:border-accent/40 transition-all duration-300 h-full">
            <span className="text-[9px] font-display font-semibold uppercase tracking-[0.14em] text-dark-400 block mb-4">
              Quick Access
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { href: '/clients',              label: 'Add Client',    icon: Users },
                { href: '/invoices',             label: 'New Invoice',   icon: FileText },
                { href: '/tools/brief',          label: 'Brand Builder', icon: Wand2 },
                { href: '/tools/social-content', label: 'Social Tools',  icon: DollarSign },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col gap-2.5 p-3.5 border border-dark-600 dark:border-[rgba(255,255,255,0.06)] hover:border-accent/50 hover:bg-dark-700 dark:hover:bg-[rgba(255,255,255,0.03)] transition-all duration-200 group hover:-translate-y-0.5"
                >
                  <action.icon size={13} className="text-dark-400 group-hover:text-accent transition-colors" />
                  <span className="text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-300 group-hover:text-dark-100 transition-colors leading-tight flex items-center justify-between">
                    {action.label}
                    <Plus size={9} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
