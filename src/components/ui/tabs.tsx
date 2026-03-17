'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id)

  return (
    <div>
      <div className="flex gap-0 border-b border-dark-600 dark:border-[rgba(255,255,255,0.07)] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'px-4 py-2.5 text-[10px] font-display font-semibold uppercase tracking-[0.08em] transition-all duration-200 border-b-[1.5px] -mb-px cursor-pointer',
              active === tab.id
                ? 'text-accent border-accent'
                : 'text-dark-400 border-transparent hover:text-dark-200 hover:border-dark-600'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.find((t) => t.id === active)?.content}
    </div>
  )
}
