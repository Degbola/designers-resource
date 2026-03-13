'use client'

import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-dark-200">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full bg-white/60 border border-white/70 rounded-lg px-3 py-2 text-sm text-dark-100',
          'placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50',
          'backdrop-blur-sm transition-all duration-200',
          error && 'border-red-400 focus:ring-red-400/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, className, id, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-dark-200">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          'w-full bg-white/60 border border-white/70 rounded-lg px-3 py-2 text-sm text-dark-100',
          'placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50',
          'backdrop-blur-sm transition-all duration-200 min-h-[80px] resize-y',
          className
        )}
        {...props}
      />
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-dark-200">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'w-full bg-white/60 border border-white/70 rounded-lg px-3 py-2 text-sm text-dark-100',
          'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50',
          'backdrop-blur-sm transition-all duration-200 cursor-pointer',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
