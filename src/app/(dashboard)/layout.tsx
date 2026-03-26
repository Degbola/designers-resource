export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ensureSchema } from '@/lib/db'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CurrencyProvider } from '@/lib/currency-context'

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

  return (
    <CurrencyProvider>
      <DashboardShell user={JSON.parse(JSON.stringify(user))}>{children}</DashboardShell>
    </CurrencyProvider>
  )
}
