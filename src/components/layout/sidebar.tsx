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
  Shield,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { SafeUser } from '@/types'
import { hasPermission, type Permission } from '@/lib/permissions'

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { href: '/',         label: 'Dashboard',  icon: LayoutDashboard, permission: null },
      { href: '/clients',  label: 'Clients',    icon: Users,           permission: 'clients' as Permission },
      { href: '/projects', label: 'Projects',   icon: FolderKanban,    permission: 'projects' as Permission },
      { href: '/invoices', label: 'Invoices',   icon: FileText,        permission: 'invoices' as Permission },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/finances', label: 'Finances',   icon: DollarSign,      permission: 'finances' as Permission },
    ],
  },
  {
    label: 'Library',
    items: [
      { href: '/resources', label: 'Resources', icon: BookOpen,        permission: 'resources' as Permission },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/tools',                label: 'Design Tools',    icon: Wrench,     permission: 'tools' as Permission },
      { href: '/tools/colors',         label: 'Color Palette',   icon: Palette,    permission: 'tools' as Permission },
      { href: '/tools/brief',          label: 'Visual Identity', icon: Sparkles,   permission: 'tools' as Permission },
      { href: '/tools/brand-generator',label: 'Brand Generator', icon: Wand2,      permission: 'brands' as Permission },
      { href: '/tools/social-content', label: 'Social Content',  icon: LayoutGrid, permission: 'social' as Permission },
    ],
  },
]

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 rounded-md text-dark-400 hover:text-dark-200 hover:bg-dark-600 transition-colors cursor-pointer"
      aria-label="Open menu"
    >
      <Menu size={18} />
    </button>
  )
}

export function Sidebar({ user, mobileOpen, onMobileClose }: { user: SafeUser; mobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
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
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
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
        'flex items-center gap-3 border-b border-dark-600 dark:border-[rgba(255,255,255,0.06)] transition-all duration-300',
        collapsed && !mobileOpen ? 'h-16 justify-center px-0' : 'h-16 px-6'
      )}>
        <div className="w-6 h-6 bg-accent rounded flex items-center justify-center flex-shrink-0">
          <span className="font-display text-white dark:text-[#0C120E] text-[9px] font-bold tracking-tight">SS</span>
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="overflow-hidden">
            <p className="font-serif text-dark-100 text-sm font-semibold leading-none tracking-tight">Seysey</p>
            <p className="text-[9px] text-dark-400 tracking-[0.12em] uppercase leading-tight mt-0.5">Studios</p>
          </div>
        )}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="ml-auto p-1.5 rounded text-dark-400 hover:text-dark-200 hover:bg-dark-600 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => {
          const isOpen = openGroups[group.label] ?? true
          const isCollapsedDesktop = collapsed && !mobileOpen
          const visibleItems = group.items.filter(item =>
            !item.permission || hasPermission(user, item.permission)
          )
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label} className={cn('mb-1', isCollapsedDesktop ? 'px-2' : 'px-4')}>
              {(!collapsed || mobileOpen) ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-1 py-1 mt-3 mb-1 hover:opacity-100 transition-opacity cursor-pointer group/grp"
                >
                  <span className="text-[9px] font-display font-semibold tracking-[0.14em] uppercase text-dark-400">
                    {group.label}
                  </span>
                  <ChevronDown
                    size={9}
                    className={cn('text-dark-400 transition-transform duration-200', isOpen ? 'rotate-0' : '-rotate-90')}
                  />
                </button>
              ) : (
                <div className="border-t border-dark-600 dark:border-[rgba(255,255,255,0.06)] my-3" />
              )}

              {(isOpen || isCollapsedDesktop) && visibleItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-2 py-1.5 text-[11px] font-display font-medium tracking-[0.05em] uppercase transition-all duration-300 relative mb-px rounded',
                      active
                        ? 'text-accent dark:text-accent font-semibold opacity-100'
                        : 'text-dark-400 opacity-60 hover:opacity-100 hover:text-dark-200 dark:hover:text-dark-200',
                      isCollapsedDesktop && 'justify-center px-0'
                    )}
                    title={isCollapsedDesktop ? item.label : undefined}
                  >
                    {active && !isCollapsedDesktop && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                    )}
                    {(!active || isCollapsedDesktop) && (
                      <item.icon
                        size={13}
                        className={cn('flex-shrink-0 transition-colors', active ? 'text-accent' : 'text-dark-400')}
                      />
                    )}
                    {(!collapsed || mobileOpen) && (
                      <span>{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Admin section */}
      {user.role === 'admin' && (
        <div className={cn('mb-1', collapsed && !mobileOpen ? 'px-2' : 'px-4')}>
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center justify-between w-full px-1 py-1 mt-3 mb-1">
              <span className="text-[9px] font-display font-semibold tracking-[0.14em] uppercase text-dark-400">Admin</span>
            </div>
          ) : (
            <div className="border-t border-dark-600 dark:border-[rgba(255,255,255,0.06)] my-3" />
          )}
          <Link
            href="/admin/users"
            className={cn(
              'flex items-center gap-2.5 px-2 py-1.5 text-[11px] font-display font-medium tracking-[0.05em] uppercase transition-all duration-300 relative mb-px rounded',
              isActive('/admin/users')
                ? 'text-accent dark:text-accent font-semibold opacity-100'
                : 'text-dark-400 opacity-60 hover:opacity-100 hover:text-dark-200 dark:hover:text-dark-200',
              collapsed && !mobileOpen && 'justify-center px-0'
            )}
            title={collapsed && !mobileOpen ? 'Users' : undefined}
          >
            {isActive('/admin/users') && !collapsed && <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
            {(!isActive('/admin/users') || (collapsed && !mobileOpen)) && (
              <Shield size={13} className={cn('flex-shrink-0 transition-colors', isActive('/admin/users') ? 'text-accent' : 'text-dark-400')} />
            )}
            {(!collapsed || mobileOpen) && <span>Users</span>}
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className={cn(
        'border-t border-dark-600 dark:border-[rgba(255,255,255,0.06)] py-3 space-y-1',
        collapsed && !mobileOpen ? 'px-2' : 'px-4'
      )}>
        {/* User info */}
        <div className={cn(
          'flex items-center gap-2 px-2 py-2',
          collapsed && !mobileOpen && 'justify-center'
        )}>
          <div className="w-6 h-6 rounded-full border border-dark-600 dark:border-[rgba(255,255,255,0.10)] flex items-center justify-center flex-shrink-0">
            <span className="font-display text-dark-300 text-[9px] font-semibold uppercase">
              {user.name?.charAt(0) || 'U'}
            </span>
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-dark-200 truncate leading-tight">{user.name}</p>
              <p className="text-[9px] text-dark-400 truncate leading-tight tracking-wide">{user.email}</p>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1.5 text-[10px] font-display font-medium uppercase tracking-[0.08em] text-dark-400 hover:text-red-500 transition-all cursor-pointer opacity-60 hover:opacity-100',
            collapsed && !mobileOpen && 'justify-center'
          )}
          title={collapsed && !mobileOpen ? 'Sign out' : undefined}
        >
          <LogOut size={11} className="flex-shrink-0" />
          {(!collapsed || mobileOpen) && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-full py-1 text-dark-400 hover:text-dark-300 opacity-50 hover:opacity-100 transition-all cursor-pointer"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden md:flex h-screen sticky top-0 glass-sidebar flex-col transition-all duration-300',
        collapsed ? 'w-[58px]' : 'w-[210px]'
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[2px] md:hidden animate-fade-in"
          onClick={onMobileClose}
        >
          <aside
            className="w-[240px] h-full glass-sidebar flex flex-col animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
