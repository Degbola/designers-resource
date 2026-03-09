import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  await initDb()
  const db = getDb()

  const clientResult = await db.execute({ sql: 'SELECT id FROM clients WHERE portal_token = ?', args: [token] })
  const client = clientResult.rows[0] as unknown as { id: number } | undefined
  if (!client) {
    return NextResponse.json({ error: 'Invalid portal link' }, { status: 404 })
  }

  const body = await req.json()
  const { approval_id, status, feedback } = body

  const approvalResult = await db.execute({
    sql: `SELECT wa.* FROM work_approvals wa
    JOIN projects p ON wa.project_id = p.id
    WHERE wa.id = ? AND p.client_id = ?`,
    args: [approval_id, client.id],
  })

  if (!approvalResult.rows[0]) {
    return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
  }

  await db.execute({ sql: 'UPDATE work_approvals SET status = ?, client_feedback = ? WHERE id = ?', args: [status, feedback || '', approval_id] })

  return NextResponse.json({ success: true })
}
