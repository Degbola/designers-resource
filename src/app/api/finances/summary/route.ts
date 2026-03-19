import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()

  const incomeRow = await db.prepare('SELECT COALESCE(SUM(amount),0) as t FROM income').first<{ t: number }>()
  const totalIncome = incomeRow?.t ?? 0
  const expenseRow = await db.prepare('SELECT COALESCE(SUM(amount),0) as t FROM expenses').first<{ t: number }>()
  const totalExpenses = expenseRow?.t ?? 0

  const monthlyIncomeResult = await db.prepare(`
    SELECT TO_CHAR(date::DATE, 'YYYY-MM') as month, SUM(amount) as total
    FROM income GROUP BY month ORDER BY month DESC LIMIT 12
  `).all<{ month: string; total: number }>()
  const monthlyIncome = monthlyIncomeResult.results

  const monthlyExpensesResult = await db.prepare(`
    SELECT TO_CHAR(date::DATE, 'YYYY-MM') as month, SUM(amount) as total
    FROM expenses GROUP BY month ORDER BY month DESC LIMIT 12
  `).all<{ month: string; total: number }>()
  const monthlyExpenses = monthlyExpensesResult.results

  const allMonths = new Set([
    ...monthlyIncome.map((m) => m.month),
    ...monthlyExpenses.map((m) => m.month),
  ])

  const monthly_data = Array.from(allMonths).sort().map((month) => ({
    month,
    income: monthlyIncome.find((m) => m.month === month)?.total || 0,
    expenses: monthlyExpenses.find((m) => m.month === month)?.total || 0,
  }))

  const expCatResult = await db.prepare('SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC').all<{ category: string; total: number }>()
  const expense_categories = expCatResult.results

  const incCatResult = await db.prepare('SELECT category, SUM(amount) as total FROM income GROUP BY category ORDER BY total DESC').all<{ category: string; total: number }>()
  const income_categories = incCatResult.results

  return NextResponse.json({
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_profit: totalIncome - totalExpenses,
    monthly_data,
    expense_categories,
    income_categories,
  })
}
