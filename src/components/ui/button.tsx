'use client'

import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-display font-semibold uppercase tracking-[0.06em] rounded transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]'

  const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white btn-glow',
    secondary: 'border border-dark-600 dark:border-[rgba(255,255,255,0.10)] text-dark-200 dark:text-dark-200 hover:border-accent/50 hover:text-dark-100',
    ghost: 'text-dark-400 hover:text-dark-200 hover:bg-dark-600 dark:hover:bg-[rgba(255,255,255,0.04)]',
    danger: 'border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10',
  }

  const sizes = {
    sm: 'text-[10px] px-3 py-1.5 gap-1.5',
    md: 'text-[11px] px-4 py-2 gap-2',
    lg: 'text-[12px] px-6 py-2.5 gap-2',
  }

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}
