import { NextResponse } from 'next/server'
import type { FontCategory, GoogleFont } from '@/lib/fonts-data'
import { GOOGLE_FONTS } from '@/lib/fonts-data'

interface GFontItem {
  family: string
  category: string
  variants: string[]
  lastModified: string
}

function parseVariants(variants: string[]): number[] {
  return variants
    .map(v => {
      if (v === 'regular') return 400
      if (v === 'italic') return null
      const n = parseInt(v)
      return isNaN(n) ? null : n
    })
    .filter((v): v is number => v !== null && !isNaN(v))
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => a - b)
}

function normalizeCategory(cat: string): FontCategory {
  if (cat === 'sans-serif') return 'sans-serif'
  if (cat === 'serif') return 'serif'
  if (cat === 'display') return 'display'
  if (cat === 'handwriting') return 'handwriting'
  if (cat === 'monospace') return 'monospace'
  return 'sans-serif'
}

// 90 days ago threshold for "new"
const NEW_THRESHOLD = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

// Module-level in-memory cache (survives across requests within one server process)
const TTL = 24 * 60 * 60 * 1000 // 24h in ms
let memCache: { fonts: GoogleFont[]; ts: number } | null = null

export async function GET() {
  const apiKey = process.env.GOOGLE_FONTS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ fonts: GOOGLE_FONTS, source: 'static' })
  }

  // Serve from in-memory cache if still fresh
  if (memCache && Date.now() - memCache.ts < TTL) {
    return NextResponse.json({ fonts: memCache.fonts, source: 'live', total: memCache.fonts.length })
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`
    )

    if (!res.ok) throw new Error(`Google Fonts API error: ${res.status}`)

    const data = await res.json()
    const items: GFontItem[] = data.items ?? []

    const fonts: GoogleFont[] = items.map((item, index) => ({
      family: item.family,
      category: normalizeCategory(item.category),
      variants: parseVariants(item.variants),
      popularity: index + 1,
      trending: index < 20,
      isNew: item.lastModified >= NEW_THRESHOLD,
    }))

    memCache = { fonts, ts: Date.now() }
    return NextResponse.json({ fonts, source: 'live', total: fonts.length })
  } catch (e) {
    console.error('Google Fonts API failed, using static fallback:', e)
    return NextResponse.json({ fonts: GOOGLE_FONTS, source: 'static' })
  }
}
