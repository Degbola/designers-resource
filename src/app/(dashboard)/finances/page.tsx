import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FinancesClientPage } from './_ClientPage'

export default async function FinancesPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const db = getDb()

  const [incomeRow, expenseRow, monthlyIncomeResult, monthlyExpensesResult, expCatResult, incCatResult, incomeResult, expensesResult, clientsResult] = await Promise.all([
    db.prepare('SELECT COALESCE(SUM(amount),0) as t FROM income WHERE user_id = ?').bind(user.id).first<{ t: number }>(),
    db.prepare('SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE user_id = ?').bind(user.id).first<{ t: number }>(),
    db.prepare(`SELECT strftime('%Y-%m', date) as month, SUM(amount) as total FROM income WHERE user_id = ? GROUP BY month ORDER BY month DESC LIMIT 12`).bind(user.id).all<{ month: string; total: number }>(),
    db.prepare(`SELECT strftime('%Y-%m', date) as month, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY month ORDER BY month DESC LIMIT 12`).bind(user.id).all<{ month: string; total: number }>(),
    db.prepare('SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category ORDER BY total DESC').bind(user.id).all<{ category: string; total: number }>(),
    db.prepare('SELECT category, SUM(amount) as total FROM income WHERE user_id = ? GROUP BY category ORDER BY total DESC').bind(user.id).all<{ category: string; total: number }>(),
    db.prepare(`SELECT i.*, c.name as client_name FROM income i LEFT JOIN clients c ON i.client_id = c.id WHERE i.user_id = ? ORDER BY i.date DESC`).bind(user.id).all(),
    db.prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC').bind(user.id).all(),
    db.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY name').bind(user.id).all(),
  ])

  const totalIncome = incomeRow?.t ?? 0
  const totalExpenses = expenseRow?.t ?? 0
  const monthlyIncome = monthlyIncomeResult.results
  const monthlyExpenses = monthlyExpensesResult.results
  const allMonths = new Set([...monthlyIncome.map((m) => m.month), ...monthlyExpenses.map((m) => m.month)])
  const monthly_data = Array.from(allMonths).sort().map((month) => ({
    month,
    income: monthlyIncome.find((m) => m.month === month)?.total || 0,
    expenses: monthlyExpenses.find((m) => m.month === month)?.total || 0,
  }))

  const summary = {
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_profit: totalIncome - totalExpenses,
    monthly_data,
    expense_categories: expCatResult.results,
    income_categories: incCatResult.results,
  }

  return (
    <FinancesClientPage
      initialSummary={summary as any}
      initialIncome={incomeResult.results as any}
      initialExpenses={expensesResult.results as any}
      initialClients={clientsResult.results as any}
    />
  )
}
