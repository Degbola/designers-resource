import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const result = await db.prepare(
    `SELECT id, brand_name, tagline, industry, created_at FROM brand_generations ORDER BY created_at DESC LIMIT 50`
  ).all<{ id: number; brand_name: string; tagline: string; industry: string; created_at: string }>()
  return NextResponse.json({ brands: result.results })
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const { result, prompt } = await req.json()
  if (!result?.brand?.name) return NextResponse.json({ error: 'Invalid brand data' }, { status: 400 })

  const insertResult = await db.prepare(
    `INSERT INTO brand_generations (brand_name, tagline, industry, prompt, result_json) VALUES (?, ?, ?, ?, ?)`
  ).bind(
    result.brand.name,
    result.brand.tagline ?? '',
    result.brand.industry ?? '',
    prompt ?? '',
    JSON.stringify(result),
  ).run()
  return NextResponse.json({ ok: true, id: Number(insertResult.meta.last_row_id) })
}
