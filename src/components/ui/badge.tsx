import { cn } from '@/lib/utils'
import { getStatusColor } from '@/lib/utils'

const PULSE_STATUSES = new Set(['active', 'in_progress', 'overdue', 'pending'])

interface BadgeProps {
  children: React.ReactNode
  variant?: string
  className?: string
}

export function Badge({ children, variant, className }: BadgeProps) {
  const shouldPulse = variant && PULSE_STATUSES.has(variant)
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variant ? getStatusColor(variant) : 'bg-white/30 text-dark-300',
      shouldPulse && 'badge-pulse',
      className
    )}>
      {children}
    </span>
  )
}
