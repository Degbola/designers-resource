import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { validate, validationError } from '@/lib/validate'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const result = await db.prepare('SELECT * FROM resources WHERE user_id = ? ORDER BY is_favorite DESC, created_at DESC').bind(user.id).all()
  return NextResponse.json(result.results)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const body = await req.json()

  const error = validate(body, [
    { field: 'title', required: true, type: 'string', minLength: 1, maxLength: 200 },
  ])
  if (error) return validationError(error)

  const result = await db.prepare(
    `INSERT INTO resources (user_id, title, description, url, category, tags, is_favorite)
    VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(user.id, body.title, body.description || '', body.url || '', body.category || 'tools', body.tags || '', body.is_favorite || 0).run()

  const resource = await db.prepare('SELECT * FROM resources WHERE id = ?')
    .bind(Number(result.meta.last_row_id))
    .first()
  return NextResponse.json(resource, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const body = await req.json()

  await db.prepare(
    `UPDATE resources SET title=?, description=?, url=?, category=?, tags=?, is_favorite=?
    WHERE id=? AND user_id=?`
  ).bind(body.title, body.description, body.url, body.category, body.tags, body.is_favorite, body.id, user.id).run()

  const resource = await db.prepare('SELECT * FROM resources WHERE id = ? AND user_id = ?').bind(body.id, user.id).first()
  return NextResponse.json(resource)
}

export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.prepare('DELETE FROM resources WHERE id = ? AND user_id = ?').bind(id, user.id).run()
  return NextResponse.json({ success: true })
}
