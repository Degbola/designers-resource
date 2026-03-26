'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface CurrencyContextType {
  displayCurrency: string
  setDisplayCurrency: (c: string) => Promise<void>
  baseCurrency: string
  setBaseCurrency: (c: string) => Promise<void>
  rates: Record<string, number>
  convert: (amount: number, fromCurrency?: string) => number
  format: (amount: number, fromCurrency?: string) => string
  loading: boolean
}

const defaultContext: CurrencyContextType = {
  displayCurrency: 'USD',
  setDisplayCurrency: async () => {},
  baseCurrency: 'USD',
  setBaseCurrency: async () => {},
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
  const [baseCurrency, _setBaseCurrency] = useState<string>('USD')
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedDisplay = typeof window !== 'undefined' ? localStorage.getItem('display_currency') : null
    const storedBase = typeof window !== 'undefined' ? localStorage.getItem('base_currency') : null
    if (storedDisplay) _setDisplayCurrency(storedDisplay)
    if (storedBase) _setBaseCurrency(storedBase)

    Promise.all([
      fetch('/api/exchange-rates').then((r) => r.json()).catch(() => ({})),
      fetch('/api/user/settings').then((r) => r.json()).catch(() => ({})),
    ]).then(([ratesData, settingsData]) => {
      if (ratesData && typeof ratesData === 'object') setRates(ratesData)
      const display = settingsData?.display_currency || storedDisplay || 'USD'
      const base = settingsData?.base_currency || storedBase || 'USD'
      _setDisplayCurrency(display)
      _setBaseCurrency(base)
      localStorage.setItem('display_currency', display)
      localStorage.setItem('base_currency', base)
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

  const setBaseCurrency = useCallback(async (currency: string) => {
    _setBaseCurrency(currency)
    localStorage.setItem('base_currency', currency)
    try {
      await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_currency: currency }),
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
    <CurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency, baseCurrency, setBaseCurrency, rates, convert, format, loading }}>
      {children}
    </CurrencyContext.Provider>
  )
}
