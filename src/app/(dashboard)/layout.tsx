import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ensureSchema } from '@/lib/db'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await ensureSchema()
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  return <DashboardShell user={JSON.parse(JSON.stringify(user))}>{children}</DashboardShell>
}
