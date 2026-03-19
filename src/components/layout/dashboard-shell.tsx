'use client'

import { useState, createContext, useContext } from 'react'
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

const SearchContext = createContext<{ query: string; setQuery: (q: string) => void }>({ query: '', setQuery: () => {} })
export const useSearchQuery = () => useContext(SearchContext)

export function DashboardShell({ user, children }: { user: SafeUser; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const pathname = usePathname()

  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      <div className="flex min-h-screen">
        <Sidebar user={user} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <div key={`laser-${pathname}`} className="laser-line" aria-hidden="true" />
          <Header mobileMenuButton={<MobileMenuButton onClick={() => setMobileOpen(true)} />} searchQuery={query} onSearchChange={setQuery} />
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
    </SearchContext.Provider>
  )
}
