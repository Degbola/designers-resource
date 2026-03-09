import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { validate, validationError } from '@/lib/validate'

export async function GET() {
  await initDb()
  const db = getDb()
  const result = await db.execute(`
    SELECT i.*, c.name as client_name FROM income i
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY i.date DESC
  `)
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
    sql: 'INSERT INTO income (client_id, invoice_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)',
    args: [body.client_id || null, body.invoice_id || null, body.amount, body.category || 'design', body.description || '', body.date],
  })

  const incomeResult = await db.execute({ sql: 'SELECT * FROM income WHERE id = ?', args: [Number(result.lastInsertRowid)] })
  return NextResponse.json(incomeResult.rows[0], { status: 201 })
}

export async function DELETE(req: NextRequest) {
  await initDb()
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  await db.execute({ sql: 'DELETE FROM income WHERE id = ?', args: [id] })
  return NextResponse.json({ success: true })
}
