'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Search, ChevronRight, Bell, Plus, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/lib/theme'

// ── Route metadata ────────────────────────────────────
const ROUTE_META: Record<string, { label: string; parent?: string }> = {
  '/':                           { label: 'Dashboard' },
  '/clients':                    { label: 'Clients' },
  '/projects':                   { label: 'Projects' },
  '/invoices':                   { label: 'Invoices' },
  '/finances':                   { label: 'Finances' },
  '/resources':                  { label: 'Resource Library' },
  '/tools':                      { label: 'Design Tools' },
  '/tools/colors':               { label: 'Color Palette',   parent: '/tools' },
  '/tools/fonts':                { label: 'Font Pairing',    parent: '/tools' },
  '/tools/converter':            { label: 'Unit Converter',  parent: '/tools' },
  '/tools/brief':                { label: 'Brand Builder',   parent: '/tools' },
  '/tools/brand-generator':      { label: 'Brand Generator', parent: '/tools' },
  '/tools/social-content':       { label: 'Social Content',  parent: '/tools' },
}

function buildBreadcrumbs(pathname: string) {
  const current = ROUTE_META[pathname]
  if (!current) {
    // Dynamic routes (e.g. /clients/123)
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length >= 2) {
      const parentPath = '/' + segments[0]
      const parentMeta = ROUTE_META[parentPath]
      if (parentMeta) {
        return [
          { label: parentMeta.label, href: parentPath },
          { label: 'Detail', href: pathname },
        ]
      }
    }
    return [{ label: 'Seysey Studios', href: '/' }]
  }
  const crumbs = []
  if (current.parent) {
    const parentMeta = ROUTE_META[current.parent]
    if (parentMeta) crumbs.push({ label: parentMeta.label, href: current.parent })
  }
  crumbs.push({ label: current.label, href: pathname })
  return crumbs
}

function CurrentDate() {
  const now = new Date()
  const formatted = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return <span className="text-xs text-dark-400 tabular-nums hidden lg:block">{formatted}</span>
}

// Quick-add options mapped to routes
const QUICK_ADD_OPTIONS = [
  { label: 'New Client',   href: '/clients' },
  { label: 'New Project',  href: '/projects' },
  { label: 'New Invoice',  href: '/invoices' },
]

export function Header({ mobileMenuButton }: { mobileMenuButton?: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const breadcrumbs = buildBreadcrumbs(pathname)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  return (
    <header className="h-14 border-b border-[rgba(0,0,0,0.07)] dark:border-[rgba(0,255,157,0.08)] glass-header flex items-center justify-between px-4 md:px-5 sticky top-0 z-40 gap-3">
      {/* Left: mobile menu + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {mobileMenuButton}

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 min-w-0" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight size={12} className="text-dark-400 flex-shrink-0" />}
              {i < breadcrumbs.length - 1 ? (
                <Link
                  href={crumb.href}
                  className="font-display text-sm text-dark-400 hover:text-dark-200 transition-colors truncate max-w-[100px]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <h1 className="font-display font-bold text-dark-100 text-sm truncate">{crumb.label}</h1>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: search + date + notifications + quick-add */}
      <div className="flex items-center gap-2">
        <CurrentDate />

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-white/50 dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.10)] rounded-lg pl-8 pr-4 py-1.5 text-xs text-dark-100 placeholder:text-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 w-36 lg:w-52 transition-all backdrop-blur-sm font-display"
          />
        </div>

        {/* Theme toggle pill */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative flex items-center bg-black/8 dark:bg-white/8 border border-[rgba(0,0,0,0.10)] dark:border-[rgba(255,255,255,0.12)] rounded-full p-[3px] w-[52px] h-[26px] transition-all duration-300 cursor-pointer hover:border-accent/40 shrink-0"
        >
          <span
            className="absolute w-[20px] h-[20px] rounded-full bg-accent shadow-sm transition-all duration-300 ease-in-out"
            style={{ transform: theme === 'dark' ? 'translateX(26px)' : 'translateX(0px)' }}
          />
          <Sun size={11} className="relative z-10 ml-[3px] transition-colors duration-300" style={{ color: theme === 'light' ? '#fff' : 'rgba(255,255,255,0.35)' }} />
          <Moon size={11} className="relative z-10 ml-auto mr-[3px] transition-colors duration-300" style={{ color: theme === 'dark' ? (theme === 'dark' ? '#020402' : '#fff') : 'rgba(0,0,0,0.25)' }} />
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
          aria-label="Notifications"
        >
          <Bell size={15} />
        </button>

        {/* Quick-Add */}
        <div className="relative">
          <button
            onClick={() => setQuickAddOpen(!quickAddOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white dark:text-[#020402] text-xs font-display font-semibold transition-all hover:scale-[1.02] btn-glow shadow-sm shadow-accent/25 cursor-pointer"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">Add</span>
          </button>
          {quickAddOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setQuickAddOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-50 glass-strong rounded-xl shadow-xl overflow-hidden min-w-[150px] animate-fade-in">
                {QUICK_ADD_OPTIONS.map(opt => (
                  <button
                    key={opt.href}
                    onClick={() => {
                      setQuickAddOpen(false)
                      router.push(opt.href)
                    }}
                    className="block w-full text-left px-4 py-2.5 text-xs font-display font-medium text-dark-200 hover:text-dark-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
