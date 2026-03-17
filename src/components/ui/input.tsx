'use client'

import { cn } from '@/lib/utils'

const inputBase = [
  'w-full px-3 py-[7px] text-[13px] font-display rounded',
  'text-dark-100 bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)]',
  'border border-dark-600 dark:border-[rgba(255,255,255,0.08)]',
  'placeholder:text-dark-400',
  'focus:outline-none focus:border-accent/50 dark:focus:border-accent/50',
  'transition-colors duration-200',
].join(' ')

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-300">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(inputBase, error && 'border-red-400 focus:border-red-400', className)}
        {...props}
      />
      {error && <p className="text-[11px] font-display text-red-500">{error}</p>}
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
        <label htmlFor={id} className="block text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-300">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(inputBase, 'min-h-[80px] resize-y', className)}
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
        <label htmlFor={id} className="block text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-300">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(inputBase, 'cursor-pointer', className)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
