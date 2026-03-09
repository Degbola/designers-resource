import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { generateToken, getRandomAvatarColor } from '@/lib/utils'
import { validate, validationError } from '@/lib/validate'

export async function GET() {
  await initDb()
  const db = getDb()
  const result = await db.execute(`
    SELECT c.*,
      (SELECT COUNT(*) FROM projects WHERE client_id = c.id) as project_count,
      (SELECT COALESCE(SUM(total),0) FROM invoices WHERE client_id = c.id AND status = 'paid') as total_paid
    FROM clients c ORDER BY c.updated_at DESC
  `)
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  await initDb()
  const db = getDb()
  const body = await req.json()

  const error = validate(body, [
    { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 200 },
  ])
  if (error) return validationError(error)

  const result = await db.execute({
    sql: `INSERT INTO clients (name, email, phone, company, address, status, onboarding_step, portal_token, notes, avatar_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      body.name, body.email || '', body.phone || '', body.company || '', body.address || '',
      body.status || 'lead', body.onboarding_step || 0, generateToken(), body.notes || '',
      body.avatar_color || getRandomAvatarColor(),
    ],
  })

  const clientResult = await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [Number(result.lastInsertRowid)] })
  return NextResponse.json(clientResult.rows[0], { status: 201 })
}

export async function PUT(req: NextRequest) {
  await initDb()
  const db = getDb()
  const body = await req.json()

  await db.execute({
    sql: `UPDATE clients SET name=?, email=?, phone=?, company=?, address=?, status=?, onboarding_step=?, notes=?, updated_at=datetime('now')
    WHERE id=?`,
    args: [body.name, body.email, body.phone, body.company, body.address, body.status, body.onboarding_step, body.notes, body.id],
  })

  const clientResult = await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [body.id] })
  return NextResponse.json(clientResult.rows[0])
}

export async function DELETE(req: NextRequest) {
  await initDb()
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.execute({ sql: 'DELETE FROM clients WHERE id = ?', args: [id] })
  return NextResponse.json({ success: true })
}
