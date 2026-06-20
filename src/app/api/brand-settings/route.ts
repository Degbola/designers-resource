import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'

export interface BrandSettings {
  logo_url: string
  brand_color: string
  accent_color: string
  business_name: string
  business_email: string
  business_address: string
  business_phone: string
  default_template: string
  default_terms: string
  font_family: string
  font_weight: number
  default_theme: 'light' | 'dark'
}

const DEFAULTS: BrandSettings = {
  logo_url: '',
  brand_color: '#1A4332',
  accent_color: '#52b788',
  business_name: '',
  business_email: '',
  business_address: '',
  business_phone: '',
  default_template: 'classic',
  default_terms: '',
  font_family: 'Inter',
  font_weight: 400,
  default_theme: 'light',
}

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getDb()
  const row = await db.prepare('SELECT * FROM user_brand_settings WHERE user_id = ?')
    .bind(user.id).first<BrandSettings>()

  return NextResponse.json(row ?? DEFAULTS)
}

export async function PUT(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Partial<BrandSettings>
  const merged: BrandSettings = { ...DEFAULTS, ...body }

  // Cap logo at ~1MB base64 (~750KB raw) — anything bigger is rejected
  if (merged.logo_url.length > 1_400_000) {
    return NextResponse.json({ error: 'Logo too large — please resize to under 1MB' }, { status: 400 })
  }

  const db = getDb()
  const existing = await db.prepare('SELECT id FROM user_brand_settings WHERE user_id = ?')
    .bind(user.id).first<{ id: number }>()

  if (existing) {
    await db.prepare(
      `UPDATE user_brand_settings SET logo_url=?, brand_color=?, accent_color=?, business_name=?, business_email=?, business_address=?, business_phone=?, default_template=?, default_terms=?, font_family=?, font_weight=?, default_theme=?, updated_at=datetime('now') WHERE user_id=?`
    ).bind(
      merged.logo_url, merged.brand_color, merged.accent_color,
      merged.business_name, merged.business_email, merged.business_address, merged.business_phone,
      merged.default_template, merged.default_terms, merged.font_family, merged.font_weight, merged.default_theme, user.id,
    ).run()
  } else {
    await db.prepare(
      `INSERT INTO user_brand_settings (user_id, logo_url, brand_color, accent_color, business_name, business_email, business_address, business_phone, default_template, default_terms, font_family, font_weight, default_theme) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user.id, merged.logo_url, merged.brand_color, merged.accent_color,
      merged.business_name, merged.business_email, merged.business_address, merged.business_phone,
      merged.default_template, merged.default_terms, merged.font_family, merged.font_weight, merged.default_theme,
    ).run()
  }

  return NextResponse.json(merged)
}
