import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className, padding = true, ...rest }: CardProps) {
  return (
    <div className={cn(
      'bg-dark-800 border border-dark-600 rounded-xl',
      padding && 'p-6',
      className
    )} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-lg font-semibold text-white', className)}>{children}</h3>
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm text-dark-300 mt-1', className)}>{children}</p>
}
