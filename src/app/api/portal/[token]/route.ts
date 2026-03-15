import { NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  await initDb()
  const db = getDb()

  const clientResult = await db.execute({ sql: 'SELECT id, name, company, email FROM clients WHERE portal_token = ?', args: [token] })
  const client = clientResult.rows[0] as unknown as { id: number; name: string; company: string; email: string } | undefined
  if (!client) {
    return NextResponse.json({ error: 'Invalid portal link' }, { status: 404 })
  }

  const projectsResult = await db.execute({
    sql: 'SELECT id, name, status, progress, due_date, description, drive_folder_url FROM projects WHERE client_id = ? ORDER BY updated_at DESC',
    args: [client.id],
  })

  const invoicesResult = await db.execute({
    sql: 'SELECT id, invoice_number, status, total, issue_date, due_date FROM invoices WHERE client_id = ? ORDER BY created_at DESC',
    args: [client.id],
  })

  const approvalsResult = await db.execute({
    sql: `SELECT wa.*, p.name as project_name FROM work_approvals wa
    JOIN projects p ON wa.project_id = p.id
    WHERE p.client_id = ? ORDER BY wa.created_at DESC`,
    args: [client.id],
  })

  const messagesResult = await db.execute({
    sql: 'SELECT id, sender, content, created_at FROM portal_messages WHERE client_id = ? ORDER BY created_at ASC',
    args: [client.id],
  })

  // Mark designer messages as read by client
  await db.execute({
    sql: `UPDATE portal_messages SET read_by_client = 1 WHERE client_id = ? AND sender = 'designer'`,
    args: [client.id],
  })

  return NextResponse.json({
    client,
    projects: projectsResult.rows,
    invoices: invoicesResult.rows,
    approvals: approvalsResult.rows,
    messages: messagesResult.rows,
  })
}
