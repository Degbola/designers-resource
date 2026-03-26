'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className={cn(
        'w-full shadow-xl',
        'rounded-t-2xl sm:rounded-lg',
        'bg-[#FDFCFA] dark:bg-[#0a0f0b]',
        'border border-[#E2DDD8] dark:border-[rgba(255,255,255,0.10)]',
        'max-h-[92dvh] sm:max-h-[85dvh] flex flex-col',
        'sm:' + sizes[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-600 dark:border-[rgba(255,255,255,0.07)]">
          <h2 className="font-serif text-lg font-normal text-dark-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-dark-400 hover:text-dark-200 opacity-60 hover:opacity-100 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
