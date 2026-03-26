import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ClientsClientPage } from './_ClientPage'

export default async function ClientsPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const db = getDb()
  const result = await db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM projects WHERE client_id = c.id) as project_count,
      (SELECT COALESCE(SUM(total),0) FROM invoices WHERE client_id = c.id AND status = 'paid') as total_paid
    FROM clients c WHERE c.user_id = ? ORDER BY c.updated_at DESC
  `).bind(user.id).all()

  return <ClientsClientPage initialClients={JSON.parse(JSON.stringify(result.results)) as any} />
}
