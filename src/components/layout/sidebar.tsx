'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  DollarSign,
  BookOpen,
  Palette,
  Wrench,
  Sparkles,
  Wand2,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/theme'
import type { SafeUser } from '@/types'

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/clients', label: 'Clients', icon: Users },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/invoices', label: 'Invoices', icon: FileText },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/finances', label: 'Finances', icon: DollarSign },
    ],
  },
  {
    label: 'Library',
    items: [
      { href: '/resources', label: 'Resources', icon: BookOpen },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/tools', label: 'Design Tools', icon: Wrench },
      { href: '/tools/colors', label: 'Color Palette', icon: Palette },
      { href: '/tools/brief', label: 'Visual Identity', icon: Sparkles },
      { href: '/tools/brand-generator', label: 'Brand Generator', icon: Wand2 },
      { href: '/tools/social-content', label: 'Social Content', icon: LayoutGrid },
    ],
  },
]

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 rounded-lg text-dark-300 hover:bg-white/40 hover:text-dark-100 transition-colors cursor-pointer"
      aria-label="Open menu"
    >
      <Menu size={20} />
    </button>
  )
}

export function Sidebar({ user, mobileOpen, onMobileClose }: { user: SafeUser; mobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Workspace: true, Finance: false, Library: false, Tools: false,
  })

  const toggleGroup = (label: string) => setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }))

  useEffect(() => {
    onMobileClose?.()
    const activeGroup = NAV_GROUPS.find(g =>
      g.items.some(item => item.href === '/' ? pathname === '/' : pathname === item.href || (item.href !== '/tools' && pathname.startsWith(item.href)))
    )
    if (activeGroup) setOpenGroups(prev => ({ ...prev, [activeGroup.label]: true }))
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname === href || (href !== '/tools' && pathname.startsWith(href))

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 border-b border-[rgba(0,0,0,0.07)] dark:border-[rgba(0,255,157,0.08)] transition-all duration-300',
        collapsed && !mobileOpen ? 'h-16 justify-center px-0' : 'h-16 px-5'
      )}>
        <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center flex-shrink-0 shadow-sm shadow-accent/30">
          <span className="font-display text-white dark:text-[#020402] text-[10px] font-bold tracking-tight">SS</span>
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="overflow-hidden">
            <p className="font-display font-bold text-dark-100 text-sm tracking-widest uppercase leading-none">Seysey</p>
            <p className="text-[10px] text-dark-400 tracking-widest uppercase leading-tight mt-0.5">Studios</p>
          </div>
        )}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="ml-auto p-1.5 rounded-lg text-dark-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-dark-200 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => {
          const isOpen = openGroups[group.label] ?? true
          const isCollapsedDesktop = collapsed && !mobileOpen
          return (
            <div key={group.label} className={cn('mb-1', isCollapsedDesktop ? 'px-2' : 'px-3')}>

              {(!collapsed || mobileOpen) ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-2 py-1 mt-2 mb-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group/grp"
                >
                  <span className="text-[9px] font-display font-bold tracking-[0.15em] uppercase text-dark-400 group-hover/grp:text-dark-300 transition-colors">
                    {group.label}
                  </span>
                  <ChevronDown
                    size={10}
                    className={cn('text-dark-400 transition-transform duration-200', isOpen ? 'rotate-0' : '-rotate-90')}
                  />
                </button>
              ) : (
                <div className="border-t border-[rgba(0,0,0,0.07)] dark:border-[rgba(0,255,157,0.08)] my-2" />
              )}

              {(isOpen || isCollapsedDesktop) && group.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group relative mb-0.5',
                      active
                        ? 'text-white dark:text-[#020402] bg-accent shadow-sm shadow-accent/25 font-medium'
                        : 'text-dark-300 hover:text-dark-100 hover:bg-black/5 dark:hover:bg-white/5',
                      isCollapsedDesktop && 'justify-center px-2'
                    )}
                    title={isCollapsedDesktop ? item.label : undefined}
                  >
                    <item.icon
                      size={16}
                      className={cn('flex-shrink-0 transition-colors', active ? 'text-white dark:text-[#020402]' : 'text-dark-400 group-hover:text-dark-200')}
                    />
                    {(!collapsed || mobileOpen) && (
                      <span className="font-medium text-[13px]">{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        'border-t border-[rgba(0,0,0,0.07)] dark:border-[rgba(0,255,157,0.08)] py-3 space-y-1',
        collapsed && !mobileOpen ? 'px-2' : 'px-3'
      )}>
        {/* User info */}
        <div className={cn(
          'flex items-center gap-2.5 px-2 py-2 rounded-lg',
          collapsed && !mobileOpen && 'justify-center'
        )}>
          <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
            <span className="font-display text-accent text-[10px] font-bold uppercase">
              {user.name?.charAt(0) || 'U'}
            </span>
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-dark-100 truncate leading-tight">{user.name}</p>
              <p className="text-[10px] text-dark-400 truncate leading-tight">{user.email}</p>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        {(!collapsed || mobileOpen) ? (
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-[12px] text-dark-400 hover:text-dark-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={14} className="flex-shrink-0" /> : <Moon size={14} className="flex-shrink-0" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        ) : (
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-full py-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        )}

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-[12px] text-dark-400 hover:text-red-500 hover:bg-red-50/60 dark:hover:bg-red-500/10 transition-all cursor-pointer group',
            collapsed && !mobileOpen && 'justify-center'
          )}
          title={collapsed && !mobileOpen ? 'Sign out' : undefined}
        >
          <LogOut size={14} className="flex-shrink-0 group-hover:text-red-500 transition-colors" />
          {(!collapsed || mobileOpen) && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-full py-1.5 rounded-lg text-dark-400 hover:text-dark-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden md:flex h-screen sticky top-0 glass-sidebar flex-col transition-all duration-300',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={onMobileClose}
        >
          <aside
            className="w-[260px] h-full glass-sidebar flex flex-col animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
