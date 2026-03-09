import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { validate, validationError } from '@/lib/validate'

export async function GET() {
  await initDb()
  const db = getDb()
  const result = await db.execute('SELECT * FROM resources ORDER BY is_favorite DESC, created_at DESC')
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  await initDb()
  const db = getDb()
  const body = await req.json()

  const error = validate(body, [
    { field: 'title', required: true, type: 'string', minLength: 1, maxLength: 200 },
  ])
  if (error) return validationError(error)

  const result = await db.execute({
    sql: `INSERT INTO resources (title, description, url, category, tags, is_favorite)
    VALUES (?, ?, ?, ?, ?, ?)`,
    args: [body.title, body.description || '', body.url || '', body.category || 'tools', body.tags || '', body.is_favorite || 0],
  })

  const resourceResult = await db.execute({ sql: 'SELECT * FROM resources WHERE id = ?', args: [Number(result.lastInsertRowid)] })
  return NextResponse.json(resourceResult.rows[0], { status: 201 })
}

export async function PUT(req: NextRequest) {
  await initDb()
  const db = getDb()
  const body = await req.json()

  await db.execute({
    sql: `UPDATE resources SET title=?, description=?, url=?, category=?, tags=?, is_favorite=?
    WHERE id=?`,
    args: [body.title, body.description, body.url, body.category, body.tags, body.is_favorite, body.id],
  })

  const resourceResult = await db.execute({ sql: 'SELECT * FROM resources WHERE id = ?', args: [body.id] })
  return NextResponse.json(resourceResult.rows[0])
}

export async function DELETE(req: NextRequest) {
  await initDb()
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.execute({ sql: 'DELETE FROM resources WHERE id = ?', args: [id] })
  return NextResponse.json({ success: true })
}
