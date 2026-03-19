import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'social')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const result = await db.prepare(
    `SELECT id, brand_name, platforms, content_types, format_preference, post_count, created_at FROM social_content_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
  ).bind(user.id).all<{ id: number; brand_name: string; platforms: string; content_types: string; format_preference: string; post_count: number; created_at: string }>()
  return NextResponse.json({ items: result.results })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'social')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const { brand_name, platforms, content_types, format_preference, posts } = await req.json()
  if (!posts?.length) return NextResponse.json({ error: 'No posts provided' }, { status: 400 })

  const insertResult = await db.prepare(
    `INSERT INTO social_content_history (user_id, brand_name, platforms, content_types, format_preference, post_count, posts_json) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id,
    brand_name ?? '',
    Array.isArray(platforms) ? platforms.join(', ') : (platforms ?? ''),
    Array.isArray(content_types) ? content_types.join(', ') : (content_types ?? ''),
    format_preference ?? '',
    posts.length,
    JSON.stringify(posts),
  ).run()
  return NextResponse.json({ ok: true, id: Number(insertResult.meta.last_row_id) })
}
