import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const row = await db.prepare('SELECT display_currency FROM users WHERE id = ?')
    .bind(user.id).first<{ display_currency: string }>()
  return NextResponse.json({ display_currency: row?.display_currency || 'USD' })
}

export async function PUT(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { display_currency } = await req.json()
  if (!display_currency) return NextResponse.json({ error: 'display_currency required' }, { status: 400 })
  const db = getDb()
  await db.prepare('UPDATE users SET display_currency = ? WHERE id = ?').bind(display_currency, user.id).run()
  return NextResponse.json({ display_currency })
}
