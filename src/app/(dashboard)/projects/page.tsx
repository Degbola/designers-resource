import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProjectsClientPage } from './_ClientPage'

export default async function ProjectsPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const db = getDb()
  const [projectsResult, clientsResult] = await Promise.all([
    db.prepare(`
      SELECT p.*, c.name as client_name FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.user_id = ? ORDER BY p.updated_at DESC
    `).bind(user.id).all(),
    db.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY name').bind(user.id).all(),
  ])

  const s = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
  return (
    <ProjectsClientPage
      initialProjects={s(projectsResult.results) as any}
      initialClients={s(clientsResult.results) as any}
    />
  )
}
