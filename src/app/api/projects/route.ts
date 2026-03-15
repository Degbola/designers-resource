import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { validate, validationError } from '@/lib/validate'

export async function GET() {
  await initDb()
  const db = getDb()
  const result = await db.execute(`
    SELECT p.*, c.name as client_name FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    ORDER BY p.updated_at DESC
  `)
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  await initDb()
  const db = getDb()
  const body = await req.json()

  const error = validate(body, [
    { field: 'client_id', required: true, type: 'number' },
    { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 200 },
  ])
  if (error) return validationError(error)

  const result = await db.execute({
    sql: `INSERT INTO projects (client_id, name, description, status, priority, start_date, due_date, budget, progress, drive_folder_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      body.client_id, body.name, body.description || '', body.status || 'not_started',
      body.priority || 'medium', body.start_date || '', body.due_date || '',
      body.budget || 0, body.progress || 0, body.drive_folder_url || '',
    ],
  })

  const projectResult = await db.execute({
    sql: 'SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ?',
    args: [Number(result.lastInsertRowid)],
  })
  return NextResponse.json(projectResult.rows[0], { status: 201 })
}

export async function PUT(req: NextRequest) {
  await initDb()
  const db = getDb()
  const body = await req.json()

  await db.execute({
    sql: `UPDATE projects SET client_id=?, name=?, description=?, status=?, priority=?, start_date=?, due_date=?, budget=?, progress=?, drive_folder_url=?, updated_at=datetime('now')
    WHERE id=?`,
    args: [body.client_id, body.name, body.description, body.status, body.priority, body.start_date, body.due_date, body.budget, body.progress, body.drive_folder_url || '', body.id],
  })

  const projectResult = await db.execute({
    sql: 'SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ?',
    args: [body.id],
  })
  return NextResponse.json(projectResult.rows[0])
}

export async function DELETE(req: NextRequest) {
  await initDb()
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [id] })
  return NextResponse.json({ success: true })
}
