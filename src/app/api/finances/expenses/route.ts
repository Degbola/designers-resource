import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { validate, validationError } from '@/lib/validate'

export async function GET() {
  await initDb()
  const db = getDb()
  const result = await db.execute('SELECT * FROM expenses ORDER BY date DESC')
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  await initDb()
  const db = getDb()
  const body = await req.json()

  const error = validate(body, [
    { field: 'amount', required: true, type: 'number', min: 0 },
    { field: 'date', required: true, type: 'string' },
  ])
  if (error) return validationError(error)

  const result = await db.execute({
    sql: 'INSERT INTO expenses (amount, category, description, vendor, date, receipt_url) VALUES (?, ?, ?, ?, ?, ?)',
    args: [body.amount, body.category || 'general', body.description || '', body.vendor || '', body.date, body.receipt_url || ''],
  })

  const expenseResult = await db.execute({ sql: 'SELECT * FROM expenses WHERE id = ?', args: [Number(result.lastInsertRowid)] })
  return NextResponse.json(expenseResult.rows[0], { status: 201 })
}

export async function DELETE(req: NextRequest) {
  await initDb()
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  await db.execute({ sql: 'DELETE FROM expenses WHERE id = ?', args: [id] })
  return NextResponse.json({ success: true })
}
