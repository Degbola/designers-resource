import { StatCardSkeleton, TableRowSkeleton, Skeleton } from '@/components/ui/skeleton'

export default function FinancesLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass p-5 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-48 w-full rounded" />
        </div>
        <div className="glass p-5 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-48 w-full rounded" />
        </div>
      </div>
      <div className="glass overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}
      </div>
    </div>
  )
}
