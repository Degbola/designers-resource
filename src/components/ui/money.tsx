'use client'

import { useCurrency } from '@/lib/currency-context'

/**
 * Renders a monetary amount converted to the user's display currency.
 * `from` is the source currency of the raw amount (default 'USD').
 * If rates haven't loaded yet, shows the amount in its original currency.
 */
export function Money({ amount, from = 'USD', className }: {
  amount: number
  from?: string
  className?: string
}) {
  const { format, loading } = useCurrency()
  if (loading) {
    // Show original currency while rates load
    try {
      return (
        <span className={className}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: from, minimumFractionDigits: from === 'JPY' ? 0 : 2, maximumFractionDigits: from === 'JPY' ? 0 : 2 }).format(amount)}
        </span>
      )
    } catch {
      return <span className={className}>{from} {amount.toFixed(2)}</span>
    }
  }
  return <span className={className}>{format(amount, from)}</span>
}
