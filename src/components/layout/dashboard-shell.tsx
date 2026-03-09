'use client'

import { useState } from 'react'
import { Sidebar, MobileMenuButton } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import type { SafeUser } from '@/types'

export function DashboardShell({ user, children }: { user: SafeUser; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header mobileMenuButton={<MobileMenuButton onClick={() => setMobileOpen(true)} />} />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
