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
  '/tools/colors': 'Color Palette Generator',
  '/tools/fonts': 'Font Pairing Tool',
  '/tools/converter': 'Unit Converter',
  '/tools/brief': 'Design Brief Analyzer',
}

export function Header({ mobileMenuButton }: { mobileMenuButton?: React.ReactNode }) {
  const pathname = usePathname()
  const title = pageTitles[pathname] || 'Seysey Studios'

  return (
    <header className="h-16 border-b border-dark-600 bg-dark-800/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {mobileMenuButton}
        <h1 className="text-lg md:text-xl font-semibold text-white truncate">{title}</h1>
      </div>
      <div className="relative hidden sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-dark-700 border border-dark-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-accent/50 w-48 lg:w-64"
        />
      </div>
    </header>
  )
}
