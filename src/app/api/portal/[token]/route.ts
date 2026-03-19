import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const db = getDb()

  const client = await db.prepare('SELECT id, name, company, email FROM clients WHERE portal_token = ?')
    .bind(token)
    .first<{ id: number; name: string; company: string; email: string }>()
  if (!client) {
    return NextResponse.json({ error: 'Invalid portal link' }, { status: 404 })
  }

  const projectsResult = await db.prepare(
    'SELECT id, name, status, progress, due_date, description, drive_folder_url FROM projects WHERE client_id = ? ORDER BY updated_at DESC'
  ).bind(client.id).all()

  const invoicesResult = await db.prepare(
    'SELECT id, invoice_number, status, total, issue_date, due_date FROM invoices WHERE client_id = ? ORDER BY created_at DESC'
  ).bind(client.id).all()

  const approvalsResult = await db.prepare(`SELECT wa.*, p.name as project_name FROM work_approvals wa
    JOIN projects p ON wa.project_id = p.id
    WHERE p.client_id = ? ORDER BY wa.created_at DESC`
  ).bind(client.id).all()

  const messagesResult = await db.prepare(
    'SELECT id, sender, content, created_at FROM portal_messages WHERE client_id = ? ORDER BY created_at ASC'
  ).bind(client.id).all()

  // Mark designer messages as read by client
  await db.prepare(`UPDATE portal_messages SET read_by_client = 1 WHERE client_id = ? AND sender = 'designer'`)
    .bind(client.id).run()

  return NextResponse.json({
    client,
    projects: projectsResult.results,
    invoices: invoicesResult.results,
    approvals: approvalsResult.results,
    messages: messagesResult.results,
  })
}
