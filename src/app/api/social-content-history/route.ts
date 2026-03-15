import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function GET() {
  await initDb()
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT id, brand_name, platforms, content_types, format_preference, post_count, created_at FROM social_content_history ORDER BY created_at DESC LIMIT 50`,
    args: [],
  })
  const items = result.rows.map((r) => ({
    id: r[0],
    brand_name: r[1],
    platforms: r[2],
    content_types: r[3],
    format_preference: r[4],
    post_count: r[5],
    created_at: r[6],
  }))
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  await initDb()
  const db = getDb()
  const { brand_name, platforms, content_types, format_preference, posts } = await req.json()
  if (!posts?.length) return NextResponse.json({ error: 'No posts provided' }, { status: 400 })

  const insertResult = await db.execute({
    sql: `INSERT INTO social_content_history (brand_name, platforms, content_types, format_preference, post_count, posts_json) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      brand_name ?? '',
      Array.isArray(platforms) ? platforms.join(', ') : (platforms ?? ''),
      Array.isArray(content_types) ? content_types.join(', ') : (content_types ?? ''),
      format_preference ?? '',
      posts.length,
      JSON.stringify(posts),
    ],
  })
  return NextResponse.json({ ok: true, id: Number(insertResult.lastInsertRowid) })
}
