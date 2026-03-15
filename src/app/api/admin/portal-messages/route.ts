import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await initDb()
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const result = await db.execute({
    sql: 'SELECT * FROM portal_messages WHERE client_id = ? ORDER BY created_at ASC',
    args: [clientId],
  })

  // Mark designer messages as read by designer
  await db.execute({
    sql: `UPDATE portal_messages SET read_by_designer = 1 WHERE client_id = ? AND sender = 'client'`,
    args: [clientId],
  })

  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await initDb()
  const db = getDb()
  const { client_id, content } = await req.json()

  if (!client_id || !content?.trim()) {
    return NextResponse.json({ error: 'client_id and content required' }, { status: 400 })
  }

  await db.execute({
    sql: `INSERT INTO portal_messages (client_id, sender, content, read_by_client) VALUES (?, 'designer', ?, 0)`,
    args: [client_id, content.trim()],
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
