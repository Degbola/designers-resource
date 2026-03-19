import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb()
  const { id } = await params
  const row = await db.prepare(`SELECT posts_json FROM social_content_history WHERE id = ?`)
    .bind(id)
    .first<{ posts_json: string }>()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const posts = JSON.parse(row.posts_json)
  return NextResponse.json({ posts })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb()
  const { id } = await params
  await db.prepare(`DELETE FROM social_content_history WHERE id = ?`).bind(id).run()
  return NextResponse.json({ ok: true })
}
