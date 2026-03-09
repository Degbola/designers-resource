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
      <div className="flex gap-1 border-b border-dark-600 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px cursor-pointer',
              active === tab.id
                ? 'text-accent border-accent'
                : 'text-dark-300 border-transparent hover:text-dark-100 hover:border-dark-400'
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
