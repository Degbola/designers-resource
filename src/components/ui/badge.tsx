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
      'inline-flex items-center px-2 py-0.5 text-[9px] font-display font-semibold uppercase tracking-[0.08em] border rounded-sm',
      variant ? getStatusColor(variant) : 'border-dark-600 text-dark-400 bg-transparent',
      shouldPulse && 'badge-pulse',
      className
    )}>
      {children}
    </span>
  )
}
