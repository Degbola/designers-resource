'use client'

import { usePathname } from 'next/navigation'
import { Search, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'

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
  const { theme, toggleTheme } = useTheme()

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

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative flex items-center bg-white/40 border border-white/50 rounded-full p-[3px] w-[52px] h-[26px] transition-all duration-300 cursor-pointer hover:border-white/70 shrink-0"
          style={{ background: theme === 'dark' ? 'rgba(30,41,59,0.6)' : undefined, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : undefined }}
        >
          <span
            className="absolute w-[20px] h-[20px] rounded-full bg-accent shadow-sm transition-all duration-300 ease-in-out"
            style={{ transform: theme === 'dark' ? 'translateX(26px)' : 'translateX(0px)' }}
          />
          <Sun size={11} className="relative z-10 ml-[3px] transition-colors duration-300" style={{ color: theme === 'light' ? '#fff' : '#94a3b8' }} />
          <Moon size={11} className="relative z-10 ml-auto mr-[3px] transition-colors duration-300" style={{ color: theme === 'dark' ? '#fff' : '#94a3b8' }} />
        </button>
      </div>
    </header>
  )
}
