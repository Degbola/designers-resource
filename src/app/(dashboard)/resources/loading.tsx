import { CardSkeleton, Skeleton } from '@/components/ui/skeleton'

export default function ResourcesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-56 rounded" />
          <Skeleton className="h-9 w-36 rounded" />
        </div>
        <Skeleton className="h-9 w-32 rounded" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} rows={2} />)}
      </div>
    </div>
  )
}
