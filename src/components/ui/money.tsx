'use client'

import { useCurrency } from '@/lib/currency-context'

/**
 * Renders a monetary amount converted to the user's display currency.
 * `from` is the source currency of the raw amount (default 'USD').
 * If rates haven't loaded yet, shows the amount in its original currency.
 */
export function Money({ amount, from, className }: {
  amount: number
  from?: string  // source currency — if omitted, amount is already in display currency (no conversion)
  className?: string
}) {
  const { format, loading, displayCurrency } = useCurrency()
  if (loading) {
    // Show amount in whatever currency we know about while rates load
    const currency = from || displayCurrency || 'USD'
    try {
      return (
        <span className={className}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: currency === 'JPY' ? 0 : 2, maximumFractionDigits: currency === 'JPY' ? 0 : 2 }).format(amount)}
        </span>
      )
    } catch {
      return <span className={className}>{currency} {amount.toFixed(2)}</span>
    }
  }
  return <span className={className}>{format(amount, from)}</span>
}
