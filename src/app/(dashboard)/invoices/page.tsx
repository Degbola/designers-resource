import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InvoicesClientPage } from './_ClientPage'

export default async function InvoicesPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const db = getDb()
  const [invoicesResult, clientsResult, projectsResult] = await Promise.all([
    db.prepare(`
      SELECT i.*, c.name as client_name FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = ? ORDER BY i.created_at DESC
    `).bind(user.id).all(),
    db.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY name').bind(user.id).all(),
    db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY name').bind(user.id).all(),
  ])

  const s = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
  return (
    <InvoicesClientPage
      initialInvoices={s(invoicesResult.results) as any}
      initialClients={s(clientsResult.results) as any}
      initialProjects={s(projectsResult.results) as any}
    />
  )
}
