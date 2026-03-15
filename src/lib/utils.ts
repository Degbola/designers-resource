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
    lead: 'bg-yellow-100/70 text-yellow-700',
    active: 'bg-emerald-100/70 text-emerald-700',
    completed: 'bg-blue-100/70 text-blue-700',
    archived: 'bg-zinc-100/70 text-zinc-600',
    not_started: 'bg-zinc-100/70 text-zinc-600',
    in_progress: 'bg-blue-100/70 text-blue-700',
    review: 'bg-purple-100/70 text-purple-700',
    draft: 'bg-zinc-100/70 text-zinc-600',
    sent: 'bg-blue-100/70 text-blue-700',
    paid: 'bg-emerald-100/70 text-emerald-700',
    overdue: 'bg-red-100/70 text-red-600',
    pending: 'bg-yellow-100/70 text-yellow-700',
    approved: 'bg-emerald-100/70 text-emerald-700',
    revision: 'bg-orange-100/70 text-orange-700',
    low: 'bg-zinc-100/70 text-zinc-600',
    medium: 'bg-yellow-100/70 text-yellow-700',
    high: 'bg-red-100/70 text-red-600',
  }
  return colors[status] || 'bg-zinc-100/70 text-zinc-600'
}

// Normalize Unicode characters that jsPDF's WinAnsi encoding can't render
export function sanitizePdfText(text: string): string {
  if (!text) return ''
  return text
    .replace(/[\u2018\u2019\u02BC]/g, "'")   // curly/smart single quotes
    .replace(/[\u201C\u201D\u201E]/g, '"')    // curly/smart double quotes
    .replace(/\u2014/g, '--')                  // em dash
    .replace(/\u2013/g, '-')                   // en dash
    .replace(/\u2026/g, '...')                 // ellipsis
    .replace(/\u00A0/g, ' ')                   // non-breaking space
    .replace(/\u2019/g, "'")                   // right single quotation
    .replace(/[\u2000-\u200F\u2028-\u202F]/g, ' ') // various spaces/separators
    .replace(/[^\x00-\xFF]/g, (c) => {
      // Try NFD decomposition to strip diacritics, else replace with ?
      const decomposed = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return decomposed && /^[\x00-\xFF]+$/.test(decomposed) ? decomposed : '?'
    })
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
