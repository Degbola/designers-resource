import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { validate, validationError } from '@/lib/validate'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'finances')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const result = await db.prepare(`
    SELECT i.*, c.name as client_name FROM income i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.user_id = ?
    ORDER BY i.date DESC
  `).bind(user.id).all()
  return NextResponse.json(result.results)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'finances')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const body = await req.json()

  const error = validate(body, [
    { field: 'amount', required: true, type: 'number', min: 0 },
    { field: 'date', required: true, type: 'string' },
  ])
  if (error) return validationError(error)

  const result = await db.prepare(
    'INSERT INTO income (user_id, client_id, invoice_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(user.id, body.client_id || null, body.invoice_id || null, body.amount, body.category || 'design', body.description || '', body.date).run()

  const income = await db.prepare('SELECT * FROM income WHERE id = ?')
    .bind(Number(result.meta.last_row_id))
    .first()
  return NextResponse.json(income, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'finances')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  await db.prepare('DELETE FROM income WHERE id = ? AND user_id = ?').bind(id, user.id).run()
  return NextResponse.json({ success: true })
}
