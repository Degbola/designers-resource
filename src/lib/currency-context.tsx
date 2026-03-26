'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface CurrencyContextType {
  displayCurrency: string
  setDisplayCurrency: (c: string) => Promise<void>
  rates: Record<string, number>
  convert: (amount: number, fromCurrency?: string) => number
  format: (amount: number, fromCurrency?: string) => string
  loading: boolean
}

const defaultContext: CurrencyContextType = {
  displayCurrency: 'USD',
  setDisplayCurrency: async () => {},
  rates: {},
  convert: (a) => a,
  format: (a, c) => {
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: c || 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(a) } catch { return `${c || 'USD'} ${a.toFixed(2)}` }
  },
  loading: true,
}

const CurrencyContext = createContext<CurrencyContextType>(defaultContext)

export function useCurrency() {
  return useContext(CurrencyContext)
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [displayCurrency, _setDisplayCurrency] = useState<string>('USD')
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Read stored preference immediately (avoids flash on re-visit)
    const stored = typeof window !== 'undefined' ? localStorage.getItem('display_currency') : null
    if (stored) _setDisplayCurrency(stored)

    Promise.all([
      fetch('/api/exchange-rates').then((r) => r.json()).catch(() => ({})),
      fetch('/api/user/settings').then((r) => r.json()).catch(() => ({})),
    ]).then(([ratesData, settingsData]) => {
      if (ratesData && typeof ratesData === 'object') setRates(ratesData)
      const currency = settingsData?.display_currency || stored || 'USD'
      _setDisplayCurrency(currency)
      localStorage.setItem('display_currency', currency)
    }).finally(() => setLoading(false))
  }, [])

  const setDisplayCurrency = useCallback(async (currency: string) => {
    _setDisplayCurrency(currency)
    localStorage.setItem('display_currency', currency)
    try {
      await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_currency: currency }),
      })
    } catch { /* best-effort save */ }
  }, [])

  // Convert amount from fromCurrency → displayCurrency using USD as pivot
  const convert = useCallback((amount: number, fromCurrency = 'USD'): number => {
    if (!rates[fromCurrency] || !rates[displayCurrency]) return amount
    if (fromCurrency === displayCurrency) return amount
    return (amount / rates[fromCurrency]) * rates[displayCurrency]
  }, [rates, displayCurrency])

  // Format a raw amount (in fromCurrency) into the display currency string
  const format = useCallback((amount: number, fromCurrency?: string): string => {
    const converted = fromCurrency ? convert(amount, fromCurrency) : amount
    const target = displayCurrency
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: target,
        minimumFractionDigits: target === 'JPY' ? 0 : 2,
        maximumFractionDigits: target === 'JPY' ? 0 : 2,
      }).format(converted)
    } catch {
      return `${target} ${converted.toFixed(2)}`
    }
  }, [convert, displayCurrency])

  return (
    <CurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency, rates, convert, format, loading }}>
      {children}
    </CurrencyContext.Provider>
  )
}
