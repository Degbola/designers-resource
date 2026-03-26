import { NextResponse } from 'next/server'

// Module-level cache — survives between requests in the same serverless instance
let cachedRates: Record<string, number> | null = null
let lastFetch = 0
const CACHE_MS = 60 * 60 * 1000 // 1 hour

// Fallback rates (approximate) in case the API is unreachable
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1580, GHS: 13.5,
  KES: 130, ZAR: 18.5, CAD: 1.36, AUD: 1.53, JPY: 149, CHF: 0.89, INR: 83,
}

export async function GET() {
  const now = Date.now()
  if (cachedRates && now - lastFetch < CACHE_MS) {
    return NextResponse.json(cachedRates)
  }

  try {
    // ExchangeRate-API free endpoint — no API key required, ~1,500 req/month limit
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
    })
    const data = await res.json()
    if (data.result === 'success' && data.rates) {
      cachedRates = data.rates as Record<string, number>
      lastFetch = now
      return NextResponse.json(cachedRates)
    }
  } catch {
    // Silently fall through to cached or fallback
  }

  // Return stale cache if available, else fallback
  return NextResponse.json(cachedRates ?? FALLBACK_RATES)
}
