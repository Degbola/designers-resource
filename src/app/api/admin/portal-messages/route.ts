import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getDb()
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const result = await db.prepare(
    'SELECT * FROM portal_messages WHERE client_id = ? ORDER BY created_at ASC'
  ).bind(clientId).all()

  // Mark client messages as read by designer
  await db.prepare(`UPDATE portal_messages SET read_by_designer = 1 WHERE client_id = ? AND sender = 'client'`)
    .bind(clientId).run()

  return NextResponse.json(result.results)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getDb()
  const { client_id, content } = await req.json()

  if (!client_id || !content?.trim()) {
    return NextResponse.json({ error: 'client_id and content required' }, { status: 400 })
  }

  await db.prepare(`INSERT INTO portal_messages (client_id, sender, content, read_by_client) VALUES (?, 'designer', ?, 0)`)
    .bind(client_id, content.trim()).run()

  return NextResponse.json({ success: true }, { status: 201 })
}
