import { NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function GET() {
  await initDb()
  const db = getDb()

  const incomeResult = await db.execute('SELECT COALESCE(SUM(amount),0) as t FROM income')
  const totalIncome = (incomeResult.rows[0] as unknown as { t: number }).t
  const expenseResult = await db.execute('SELECT COALESCE(SUM(amount),0) as t FROM expenses')
  const totalExpenses = (expenseResult.rows[0] as unknown as { t: number }).t

  const monthlyIncomeResult = await db.execute(`
    SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
    FROM income GROUP BY month ORDER BY month DESC LIMIT 12
  `)
  const monthlyIncome = monthlyIncomeResult.rows as unknown as { month: string; total: number }[]

  const monthlyExpensesResult = await db.execute(`
    SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
    FROM expenses GROUP BY month ORDER BY month DESC LIMIT 12
  `)
  const monthlyExpenses = monthlyExpensesResult.rows as unknown as { month: string; total: number }[]

  const allMonths = new Set([
    ...monthlyIncome.map((m) => m.month),
    ...monthlyExpenses.map((m) => m.month),
  ])

  const monthly_data = Array.from(allMonths).sort().map((month) => ({
    month,
    income: monthlyIncome.find((m) => m.month === month)?.total || 0,
    expenses: monthlyExpenses.find((m) => m.month === month)?.total || 0,
  }))

  const expCatResult = await db.execute('SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC')
  const expense_categories = expCatResult.rows as unknown as { category: string; total: number }[]

  const incCatResult = await db.execute('SELECT category, SUM(amount) as total FROM income GROUP BY category ORDER BY total DESC')
  const income_categories = incCatResult.rows as unknown as { category: string; total: number }[]

  return NextResponse.json({
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_profit: totalIncome - totalExpenses,
    monthly_data,
    expense_categories,
    income_categories,
  })
}
