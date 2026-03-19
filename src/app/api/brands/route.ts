import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'brands')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const result = await db.prepare(
    `SELECT id, brand_name, tagline, industry, created_at FROM brand_generations WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
  ).bind(user.id).all<{ id: number; brand_name: string; tagline: string; industry: string; created_at: string }>()
  return NextResponse.json({ brands: result.results })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'brands')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const { result, prompt } = await req.json()
  if (!result?.brand?.name) return NextResponse.json({ error: 'Invalid brand data' }, { status: 400 })

  const insertResult = await db.prepare(
    `INSERT INTO brand_generations (user_id, brand_name, tagline, industry, prompt, result_json) VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id,
    result.brand.name,
    result.brand.tagline ?? '',
    result.brand.industry ?? '',
    prompt ?? '',
    JSON.stringify(result),
  ).run()
  return NextResponse.json({ ok: true, id: Number(insertResult.meta.last_row_id) })
}
