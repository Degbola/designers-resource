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
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
} from 'lucide-react'
import { useState } from 'react'
import type { SafeUser } from '@/types'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/finances', label: 'Finances', icon: DollarSign },
  { href: '/resources', label: 'Resources', icon: BookOpen },
  { href: '/tools', label: 'Design Tools', icon: Wrench },
  { href: '/tools/colors', label: 'Color Palette', icon: Palette },
  { href: '/tools/brief', label: 'Design Brief', icon: Sparkles },
]

export function Sidebar({ user }: { user: SafeUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className={cn(
      'h-screen sticky top-0 bg-dark-800 border-r border-dark-600 flex flex-col transition-all duration-300',
      collapsed ? 'w-[68px]' : 'w-[240px]'
    )}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-600">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <Palette size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-lg tracking-tight">Seysey Studios</span>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && item.href !== '/tools' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-dark-600 space-y-2">
        <div className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg',
          collapsed && 'justify-center px-2'
        )}>
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <UserIcon size={16} className="text-accent" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-dark-400 truncate">{user.email}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-dark-300 hover:bg-dark-700 hover:text-red-400 transition-colors cursor-pointer',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-dark-400 hover:bg-dark-700 hover:text-dark-200 transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  )
}
