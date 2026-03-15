import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function GET() {
  await initDb()
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT id, brand_name, tagline, industry, created_at FROM brand_generations ORDER BY created_at DESC LIMIT 50`,
    args: [],
  })
  const brands = result.rows.map((r) => ({
    id: r[0],
    brand_name: r[1],
    tagline: r[2],
    industry: r[3],
    created_at: r[4],
  }))
  return NextResponse.json({ brands })
}

export async function POST(req: NextRequest) {
  await initDb()
  const db = getDb()
  const { result, prompt } = await req.json()
  if (!result?.brand?.name) return NextResponse.json({ error: 'Invalid brand data' }, { status: 400 })

  const insertResult = await db.execute({
    sql: `INSERT INTO brand_generations (brand_name, tagline, industry, prompt, result_json) VALUES (?, ?, ?, ?, ?)`,
    args: [
      result.brand.name,
      result.brand.tagline ?? '',
      result.brand.industry ?? '',
      prompt ?? '',
      JSON.stringify(result),
    ],
  })
  return NextResponse.json({ ok: true, id: Number(insertResult.lastInsertRowid) })
}
