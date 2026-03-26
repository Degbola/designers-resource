import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const row = await db.prepare('SELECT display_currency, base_currency FROM users WHERE id = ?')
    .bind(user.id).first<{ display_currency: string; base_currency: string }>()
  return NextResponse.json({
    display_currency: row?.display_currency || 'USD',
    base_currency: row?.base_currency || 'USD',
  })
}

export async function PUT(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const db = getDb()
  if (body.display_currency) {
    await db.prepare('UPDATE users SET display_currency = ? WHERE id = ?').bind(body.display_currency, user.id).run()
  }
  if (body.base_currency) {
    await db.prepare('UPDATE users SET base_currency = ? WHERE id = ?').bind(body.base_currency, user.id).run()
  }
  return NextResponse.json({ ok: true })
}
