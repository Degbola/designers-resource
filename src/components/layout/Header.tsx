'use client'

import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/projects': 'Projects',
  '/invoices': 'Invoices',
  '/finances': 'Finances',
  '/resources': 'Resource Library',
  '/tools': 'Design Tools',
  '/tools/colors': 'Color Palette',
  '/tools/fonts': 'Font Pairing',
  '/tools/converter': 'Unit Converter',
  '/tools/brief': 'Brand Builder',
}

function CurrentDate() {
  const now = new Date()
  const formatted = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  return <span className="text-xs text-dark-400 tabular-nums hidden sm:block">{formatted}</span>
}

export function Header({ mobileMenuButton }: { mobileMenuButton?: React.ReactNode }) {
  const pathname = usePathname()
  const title = pageTitles[pathname] || 'Seysey Studios'

  return (
    <header className="h-14 border-b border-white/30 glass-header flex items-center justify-between px-4 md:px-5 sticky top-0 z-40 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {mobileMenuButton}
        <h1 className="font-display font-bold text-dark-100 text-base truncate tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <CurrentDate />
        <div className="relative hidden sm:block">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-white/50 border border-white/60 rounded-lg pl-8 pr-4 py-1.5 text-xs text-dark-100 placeholder:text-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 w-40 lg:w-56 transition-all backdrop-blur-sm"
          />
        </div>
      </div>
    </header>
  )
}
