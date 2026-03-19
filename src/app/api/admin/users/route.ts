import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const user = await getSession()
  if (!user) return null
  if (user.role !== 'admin') return null
  return user
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const db = getDb()
  const result = await db.prepare(`
    SELECT id, email, name, role, is_active, permissions, created_at,
      (SELECT COUNT(*) FROM clients WHERE user_id = users.id) as client_count,
      (SELECT COUNT(*) FROM projects WHERE user_id = users.id) as project_count
    FROM users ORDER BY created_at ASC
  `).all()
  return NextResponse.json(result.results)
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const db = getDb()
  const body = await req.json()
  const { id, action } = body

  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })
  if (id === admin.id) return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })

  if (action === 'activate') {
    await db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').bind(id).run()
  } else if (action === 'deactivate') {
    await db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').bind(id).run()
    // Invalidate all sessions for this user
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run()
  } else if (action === 'make_admin') {
    await db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").bind(id).run()
  } else if (action === 'make_member') {
    await db.prepare("UPDATE users SET role = 'member' WHERE id = ?").bind(id).run()
  } else if (action === 'set_permissions') {
    const perms = body.permissions
    if (!Array.isArray(perms)) return NextResponse.json({ error: 'permissions must be an array' }, { status: 400 })
    await db.prepare('UPDATE users SET permissions = ? WHERE id = ?').bind(JSON.stringify(perms), id).run()
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const user = await db.prepare('SELECT id, email, name, role, is_active, permissions, created_at FROM users WHERE id = ?').bind(id).first()
  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  if (Number(id) === admin.id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })

  await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
  return NextResponse.json({ success: true })
}
