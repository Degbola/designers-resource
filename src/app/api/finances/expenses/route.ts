import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { validate, validationError } from '@/lib/validate'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const result = await db.prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC').bind(user.id).all()
  return NextResponse.json(result.results)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const body = await req.json()

  const error = validate(body, [
    { field: 'amount', required: true, type: 'number', min: 0 },
    { field: 'date', required: true, type: 'string' },
  ])
  if (error) return validationError(error)

  const result = await db.prepare(
    'INSERT INTO expenses (user_id, amount, category, description, vendor, date, receipt_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(user.id, body.amount, body.category || 'general', body.description || '', body.vendor || '', body.date, body.receipt_url || '').run()

  const expense = await db.prepare('SELECT * FROM expenses WHERE id = ?')
    .bind(Number(result.meta.last_row_id))
    .first()
  return NextResponse.json(expense, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  await db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').bind(id, user.id).run()
  return NextResponse.json({ success: true })
}
