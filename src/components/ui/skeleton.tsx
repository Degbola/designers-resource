import React from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn('animate-pulse rounded bg-black/[0.06] dark:bg-white/[0.06]', className)} style={style} />
  )
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="glass p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
      <div className="flex justify-between pt-2 border-t border-black/[0.05] dark:border-white/[0.05]">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-black/[0.04] dark:border-white/[0.04]">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3 flex-1', i === 0 ? 'max-w-[140px]' : 'max-w-[100px]')} />
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="glass p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}
