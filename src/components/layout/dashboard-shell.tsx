'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Sidebar, MobileMenuButton } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/Header'
import type { SafeUser } from '@/types'

const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  exit:    { opacity: 0, y: -6,  transition: { duration: 0.18, ease: 'easeIn' as const } },
}

export function DashboardShell({ user, children }: { user: SafeUser; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Laser line — re-mounts on every route change */}
        <div key={`laser-${pathname}`} className="laser-line" aria-hidden="true" />
        <Header mobileMenuButton={<MobileMenuButton onClick={() => setMobileOpen(true)} />} />
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 p-6 md:p-10 overflow-x-hidden"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  )
}
