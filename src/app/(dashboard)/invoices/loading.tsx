import { TableRowSkeleton, Skeleton } from '@/components/ui/skeleton'

export default function InvoicesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-56 rounded" />
          <Skeleton className="h-9 w-36 rounded" />
        </div>
        <Skeleton className="h-9 w-32 rounded" />
      </div>
      <div className="glass overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
          {['w-32', 'w-24', 'w-20', 'w-16', 'w-20'].map((w, i) => (
            <Skeleton key={i} className={`h-3 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)}
      </div>
    </div>
  )
}
