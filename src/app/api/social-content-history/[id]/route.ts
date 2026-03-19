import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'social')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const { id } = await params
  const row = await db.prepare(`SELECT posts_json FROM social_content_history WHERE id = ? AND user_id = ?`)
    .bind(id, user.id)
    .first<{ posts_json: string }>()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const posts = JSON.parse(row.posts_json)
  return NextResponse.json({ posts })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'social')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const { id } = await params
  await db.prepare(`DELETE FROM social_content_history WHERE id = ? AND user_id = ?`).bind(id, user.id).run()
  return NextResponse.json({ ok: true })
}
