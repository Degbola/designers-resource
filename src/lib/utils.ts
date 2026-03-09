import { v4 as uuidv4 } from 'uuid'

export function generateToken(): string {
  return uuidv4().replace(/-/g, '')
}

export function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `INV-${year}${month}-${random}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    lead: 'bg-yellow-500/20 text-yellow-400',
    active: 'bg-green-500/20 text-green-400',
    completed: 'bg-blue-500/20 text-blue-400',
    archived: 'bg-zinc-500/20 text-zinc-400',
    not_started: 'bg-zinc-500/20 text-zinc-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    review: 'bg-purple-500/20 text-purple-400',
    draft: 'bg-zinc-500/20 text-zinc-400',
    sent: 'bg-blue-500/20 text-blue-400',
    paid: 'bg-green-500/20 text-green-400',
    overdue: 'bg-red-500/20 text-red-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    revision: 'bg-orange-500/20 text-orange-400',
    low: 'bg-zinc-500/20 text-zinc-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400',
  }
  return colors[status] || 'bg-zinc-500/20 text-zinc-400'
}

export const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#2563eb',
]

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
}
