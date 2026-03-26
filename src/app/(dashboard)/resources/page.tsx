import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ResourcesClientPage } from './_ClientPage'

export default async function ResourcesPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const db = getDb()
  const result = await db.prepare(
    'SELECT * FROM resources WHERE user_id = ? ORDER BY is_favorite DESC, created_at DESC'
  ).bind(user.id).all()

  return <ResourcesClientPage initialResources={JSON.parse(JSON.stringify(result.results)) as any} />
}
