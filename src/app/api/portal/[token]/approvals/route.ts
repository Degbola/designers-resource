import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const db = getDb()

  const client = await db.prepare('SELECT id FROM clients WHERE portal_token = ?')
    .bind(token)
    .first<{ id: number }>()
  if (!client) {
    return NextResponse.json({ error: 'Invalid portal link' }, { status: 404 })
  }

  const body = await req.json()
  const { approval_id, status, feedback } = body

  const approval = await db.prepare(`SELECT wa.* FROM work_approvals wa
    JOIN projects p ON wa.project_id = p.id
    WHERE wa.id = ? AND p.client_id = ?`
  ).bind(approval_id, client.id).first()

  if (!approval) {
    return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
  }

  await db.prepare('UPDATE work_approvals SET status = ?, client_feedback = ? WHERE id = ?')
    .bind(status, feedback || '', approval_id).run()

  return NextResponse.json({ success: true })
}
