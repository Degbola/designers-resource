import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { generateToken, getRandomAvatarColor } from '@/lib/utils'
import { validate, validationError } from '@/lib/validate'
import { hasPermission } from '@/lib/permissions'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'clients')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const result = await db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM projects WHERE client_id = c.id) as project_count,
      (SELECT COALESCE(SUM(total),0) FROM invoices WHERE client_id = c.id AND status = 'paid') as total_paid
    FROM clients c WHERE c.user_id = ? ORDER BY c.updated_at DESC
  `).bind(user.id).all()
  return NextResponse.json(result.results)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'clients')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const body = await req.json()

  const error = validate(body, [
    { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 200 },
  ])
  if (error) return validationError(error)

  const result = await db.prepare(
    `INSERT INTO clients (user_id, name, email, phone, company, address, status, onboarding_step, portal_token, notes, avatar_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id, body.name, body.email || '', body.phone || '', body.company || '', body.address || '',
    body.status || 'lead', body.onboarding_step || 0, generateToken(), body.notes || '',
    body.avatar_color || getRandomAvatarColor(),
  ).run()

  const client = await db.prepare('SELECT * FROM clients WHERE id = ?')
    .bind(Number(result.meta.last_row_id))
    .first()
  return NextResponse.json(client, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'clients')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const body = await req.json()

  await db.prepare(
    `UPDATE clients SET name=?, email=?, phone=?, company=?, address=?, status=?, onboarding_step=?, notes=?, updated_at=datetime('now')
    WHERE id=? AND user_id=?`
  ).bind(body.name, body.email, body.phone, body.company, body.address, body.status, body.onboarding_step, body.notes, body.id, user.id).run()

  const client = await db.prepare('SELECT * FROM clients WHERE id = ? AND user_id = ?').bind(body.id, user.id).first()
  return NextResponse.json(client)
}

export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'clients')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?').bind(id, user.id).run()
  return NextResponse.json({ success: true })
}
