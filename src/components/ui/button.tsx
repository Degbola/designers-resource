'use client'

import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/25',
    secondary: 'bg-dark-700 hover:bg-dark-600 text-dark-100 border border-dark-500',
    ghost: 'hover:bg-dark-700 text-dark-200 hover:text-dark-100',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2',
  }

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}
