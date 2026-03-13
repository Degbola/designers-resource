import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className, padding = true, ...rest }: CardProps) {
  return (
    <div className={cn(
      'glass rounded-xl',
      padding && 'p-5',
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
  return <h3 className={cn('font-display font-bold text-dark-100 text-base tracking-tight', className)}>{children}</h3>
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm text-dark-300 mt-1', className)}>{children}</p>
}
