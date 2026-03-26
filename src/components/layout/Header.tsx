'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Search, ChevronRight, Bell, Plus, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/lib/theme'
import { useCurrency } from '@/lib/currency-context'

const DISPLAY_CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD', 'JPY', 'CHF', 'INR']

function CurrencySelector() {
  const { displayCurrency, setDisplayCurrency, baseCurrency, setBaseCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'display' | 'base'>('display')
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        title="Currency settings"
        className="text-[10px] font-display font-semibold border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded px-2 py-[3px] text-dark-400 hover:text-dark-200 hover:border-accent/40 transition-all cursor-pointer tracking-[0.06em]"
      >
        {displayCurrency}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 shadow-lg w-[160px] rounded-lg border border-[#E2DDD8] dark:border-[rgba(255,255,255,0.10)] bg-[#FDFCFA] dark:bg-[#0a0f0b] overflow-hidden animate-fade-in">
            {/* Tabs */}
            <div className="flex border-b border-[#E2DDD8] dark:border-[rgba(255,255,255,0.08)]">
              {(['display', 'base'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-[9px] font-display font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer ${tab === t ? 'text-accent border-b-2 border-accent' : 'text-dark-400 hover:text-dark-200'}`}
                >
                  {t === 'display' ? 'Show as' : 'Recorded in'}
                </button>
              ))}
            </div>
            {/* Currency list */}
            <div className="max-h-52 overflow-y-auto">
              {DISPLAY_CURRENCIES.map((c) => {
                const active = tab === 'display' ? c === displayCurrency : c === baseCurrency
                return (
                  <button
                    key={c}
                    onClick={() => {
                      if (tab === 'display') setDisplayCurrency(c)
                      else setBaseCurrency(c)
                      setOpen(false)
                    }}
                    className={`block w-full text-left px-3 py-2 text-[11px] font-display font-medium transition-colors cursor-pointer hover:bg-dark-700 dark:hover:bg-[rgba(255,255,255,0.04)] ${active ? 'text-accent' : 'text-dark-300 hover:text-dark-100'}`}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Route metadata ────────────────────────────────────
const ROUTE_META: Record<string, { label: string; parent?: string }> = {
  '/':                           { label: 'Dashboard' },
  '/clients':                    { label: 'Clients' },
  '/projects':                   { label: 'Projects' },
  '/invoices':                   { label: 'Invoices' },
  '/finances':                   { label: 'Finances' },
  '/resources':                  { label: 'Resource Library' },
  '/tools':                      { label: 'Design Tools' },
  '/tools/colors':               { label: 'Color Palette',    parent: '/tools' },
  '/tools/fonts':                { label: 'Font Pairing',     parent: '/tools' },
  '/tools/converter':            { label: 'Unit Converter',   parent: '/tools' },
  '/tools/brief':                { label: 'Brand Builder',    parent: '/tools' },
  '/tools/brand-generator':      { label: 'Brand Generator',  parent: '/tools' },
  '/tools/social-content':       { label: 'Social Content',   parent: '/tools' },
}

function buildBreadcrumbs(pathname: string) {
  const current = ROUTE_META[pathname]
  if (!current) {
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
  return (
    <span className="text-[11px] font-display text-dark-400 tracking-[0.05em] uppercase hidden lg:block">
      {formatted}
    </span>
  )
}

const QUICK_ADD_OPTIONS = [
  { label: 'New Client',   href: '/clients' },
  { label: 'New Project',  href: '/projects' },
  { label: 'New Invoice',  href: '/invoices' },
]

export function Header({ mobileMenuButton, searchQuery = '', onSearchChange }: { mobileMenuButton?: React.ReactNode; searchQuery?: string; onSearchChange?: (q: string) => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const breadcrumbs = buildBreadcrumbs(pathname)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  return (
    <header className="h-12 glass-header flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 gap-4">
      {/* Left: mobile menu + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {mobileMenuButton}

        <nav className="flex items-center gap-1.5 min-w-0" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight size={10} className="text-dark-400 flex-shrink-0" />}
              {i < breadcrumbs.length - 1 ? (
                <Link
                  href={crumb.href}
                  className="font-display text-[10px] text-dark-400 hover:text-dark-200 transition-colors uppercase tracking-[0.08em] truncate max-w-[100px]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <h1 className="font-display font-semibold text-dark-100 text-[11px] uppercase tracking-[0.08em] truncate">
                  {crumb.label}
                </h1>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: date + search + theme + notifications + add */}
      <div className="flex items-center gap-2">
        <CurrentDate />
        <CurrencySelector />

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="bg-transparent border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded pl-7 pr-3 py-1 text-[11px] font-display text-dark-200 placeholder:text-dark-400 focus:outline-none focus:border-accent/50 dark:focus:border-accent/50 w-32 lg:w-44 transition-all"
          />
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative flex items-center border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded-full p-[3px] w-[46px] h-[22px] transition-all duration-300 cursor-pointer hover:border-accent/40"
        >
          <span
            className="absolute w-[16px] h-[16px] rounded-full bg-accent transition-all duration-300 ease-in-out"
            style={{ transform: theme === 'dark' ? 'translateX(24px)' : 'translateX(0px)' }}
          />
          <Sun size={9} className="relative z-10 ml-[2px] transition-colors duration-300" style={{ color: theme === 'light' ? '#fff' : 'rgba(255,255,255,0.3)' }} />
          <Moon size={9} className="relative z-10 ml-auto mr-[2px] transition-colors duration-300" style={{ color: theme === 'dark' ? '#0C120E' : 'rgba(0,0,0,0.2)' }} />
        </button>

        {/* Notifications */}
        <button
          className="p-1.5 text-dark-400 hover:text-dark-200 transition-colors cursor-pointer opacity-70 hover:opacity-100"
          aria-label="Notifications"
        >
          <Bell size={13} />
        </button>

        {/* Quick-Add */}
        <div className="relative">
          <button
            onClick={() => setQuickAddOpen(!quickAddOpen)}
            className="flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-[10px] font-display font-semibold uppercase tracking-[0.08em] transition-all cursor-pointer btn-glow"
          >
            <Plus size={11} />
            <span className="hidden sm:inline">Add</span>
          </button>
          {quickAddOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setQuickAddOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 shadow-lg overflow-hidden min-w-[140px] animate-fade-in rounded-lg border border-[#E2DDD8] dark:border-[rgba(255,255,255,0.10)] bg-[#FDFCFA] dark:bg-[#0a0f0b]">
                {QUICK_ADD_OPTIONS.map(opt => (
                  <button
                    key={opt.href}
                    onClick={() => { setQuickAddOpen(false); router.push(opt.href) }}
                    className="block w-full text-left px-4 py-2.5 text-[11px] font-display font-medium uppercase tracking-[0.06em] text-dark-300 hover:text-dark-100 hover:bg-dark-700 dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer"
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
