'use client'

import { useCurrency } from '@/lib/currency-context'

/**
 * Renders a monetary amount converted to the user's display currency.
 * `from` is the source currency of the raw amount (default 'USD').
 * If rates haven't loaded yet, shows the amount in its original currency.
 */
// Base currency for amounts without an explicit currency (income, expenses, etc.)
// These are assumed to be recorded in USD; switch the display currency to convert.
const BASE_CURRENCY = 'USD'

export function Money({ amount, from, className }: {
  amount: number
  from?: string  // source currency of this amount — defaults to NGN
  className?: string
}) {
  const { format, loading, displayCurrency } = useCurrency()
  const sourceCurrency = from ?? BASE_CURRENCY
  if (loading) {
    const currency = sourceCurrency || displayCurrency || BASE_CURRENCY
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
  return <span className={className}>{format(amount, sourceCurrency)}</span>
}
