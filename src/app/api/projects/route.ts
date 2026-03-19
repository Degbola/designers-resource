import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { validate, validationError } from '@/lib/validate'
import { hasPermission } from '@/lib/permissions'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'projects')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const result = await db.prepare(`
    SELECT p.*, c.name as client_name FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE p.user_id = ? ORDER BY p.updated_at DESC
  `).bind(user.id).all()
  return NextResponse.json(result.results)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'projects')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const body = await req.json()

  const error = validate(body, [
    { field: 'client_id', required: true, type: 'number' },
    { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 200 },
  ])
  if (error) return validationError(error)

  const result = await db.prepare(
    `INSERT INTO projects (user_id, client_id, name, description, status, priority, start_date, due_date, budget, progress, drive_folder_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id, body.client_id, body.name, body.description || '', body.status || 'not_started',
    body.priority || 'medium', body.start_date || '', body.due_date || '',
    body.budget || 0, body.progress || 0, body.drive_folder_url || '',
  ).run()

  const project = await db.prepare(
    'SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ?'
  ).bind(Number(result.meta.last_row_id)).first()
  return NextResponse.json(project, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'projects')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const body = await req.json()

  await db.prepare(
    `UPDATE projects SET client_id=?, name=?, description=?, status=?, priority=?, start_date=?, due_date=?, budget=?, progress=?, drive_folder_url=?, updated_at=datetime('now')
    WHERE id=? AND user_id=?`
  ).bind(body.client_id, body.name, body.description, body.status, body.priority, body.start_date, body.due_date, body.budget, body.progress, body.drive_folder_url || '', body.id, user.id).run()

  const project = await db.prepare(
    'SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ?'
  ).bind(body.id).first()
  return NextResponse.json(project)
}

export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'projects')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').bind(id, user.id).run()
  return NextResponse.json({ success: true })
}
