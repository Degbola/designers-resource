import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  await initDb()
  const db = getDb()

  const clientResult = await db.execute({
    sql: 'SELECT id FROM clients WHERE portal_token = ?',
    args: [token],
  })
  const client = clientResult.rows[0] as unknown as { id: number } | undefined
  if (!client) return NextResponse.json({ error: 'Invalid portal link' }, { status: 404 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Message content required' }, { status: 400 })

  await db.execute({
    sql: `INSERT INTO portal_messages (client_id, sender, content, read_by_designer) VALUES (?, 'client', ?, 0)`,
    args: [client.id, content.trim()],
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
