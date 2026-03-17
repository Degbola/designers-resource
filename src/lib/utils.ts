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

export function formatCurrencyWith(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'NGN', label: 'NGN — Nigerian Naira' },
  { code: 'GHS', label: 'GHS — Ghanaian Cedi' },
  { code: 'KES', label: 'KES — Kenyan Shilling' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'INR', label: 'INR — Indian Rupee' },
]

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
    lead:        'border-yellow-300/60 text-yellow-700 bg-yellow-50/60 dark:border-yellow-500/20 dark:text-yellow-400 dark:bg-transparent',
    active:      'border-accent/40 text-accent bg-dark-700 dark:border-accent/30 dark:text-accent dark:bg-transparent',
    completed:   'border-blue-300/60 text-blue-600 bg-blue-50/60 dark:border-blue-500/20 dark:text-blue-400 dark:bg-transparent',
    archived:    'border-dark-600 text-dark-400 bg-transparent',
    not_started: 'border-dark-600 text-dark-400 bg-transparent',
    in_progress: 'border-blue-300/60 text-blue-600 bg-blue-50/60 dark:border-blue-500/20 dark:text-blue-400 dark:bg-transparent',
    review:      'border-purple-300/60 text-purple-600 bg-purple-50/60 dark:border-purple-500/20 dark:text-purple-400 dark:bg-transparent',
    draft:       'border-dark-600 text-dark-400 bg-transparent',
    sent:        'border-blue-300/60 text-blue-600 bg-blue-50/60 dark:border-blue-500/20 dark:text-blue-400 dark:bg-transparent',
    paid:        'border-accent/40 text-accent bg-dark-700 dark:border-accent/30 dark:text-accent dark:bg-transparent',
    overdue:     'border-red-300/60 text-red-600 bg-red-50/60 dark:border-red-500/20 dark:text-red-400 dark:bg-transparent',
    pending:     'border-yellow-300/60 text-yellow-700 bg-yellow-50/60 dark:border-yellow-500/20 dark:text-yellow-400 dark:bg-transparent',
    approved:    'border-accent/40 text-accent bg-dark-700 dark:border-accent/30 dark:text-accent dark:bg-transparent',
    revision:    'border-orange-300/60 text-orange-600 bg-orange-50/60 dark:border-orange-500/20 dark:text-orange-400 dark:bg-transparent',
    low:         'border-dark-600 text-dark-400 bg-transparent',
    medium:      'border-yellow-300/60 text-yellow-700 bg-yellow-50/60 dark:border-yellow-500/20 dark:text-yellow-400 dark:bg-transparent',
    high:        'border-red-300/60 text-red-600 bg-red-50/60 dark:border-red-500/20 dark:text-red-400 dark:bg-transparent',
  }
  return colors[status] || 'border-dark-600 text-dark-400 bg-transparent'
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
