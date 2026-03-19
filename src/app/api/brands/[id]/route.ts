import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'brands')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const { id } = await params
  const row = await db.prepare(`SELECT result_json FROM brand_generations WHERE id = ? AND user_id = ?`)
    .bind(id, user.id)
    .first<{ result_json: string }>()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const parsed = JSON.parse(row.result_json)
  return NextResponse.json({ result: parsed })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'brands')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const { id } = await params
  await db.prepare(`DELETE FROM brand_generations WHERE id = ? AND user_id = ?`).bind(id, user.id).run()
  return NextResponse.json({ ok: true })
}
