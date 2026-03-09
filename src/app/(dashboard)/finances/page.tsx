'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import type { Income, Expense, FinanceSummary, Client } from '@/types'

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4']

const INCOME_CATEGORIES = ['design', 'development', 'consulting', 'branding', 'illustration', 'other']
const EXPENSE_CATEGORIES = ['software', 'hardware', 'office', 'marketing', 'education', 'travel', 'utilities', 'general']

export default function FinancesPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [incomeList, setIncomeList] = useState<Income[]>([])
  const [expenseList, setExpenseList] = useState<Expense[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [incomeForm, setIncomeForm] = useState({ client_id: '', amount: '', category: 'design', description: '', date: new Date().toISOString().split('T')[0] })
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'general', description: '', vendor: '', date: new Date().toISOString().split('T')[0] })

  const load = useCallback(async () => {
    const [sRes, iRes, eRes, cRes] = await Promise.all([
      fetch('/api/finances/summary'), fetch('/api/finances/income'),
      fetch('/api/finances/expenses'), fetch('/api/clients'),
    ])
    setSummary(await sRes.json())
    setIncomeList(await iRes.json())
    setExpenseList(await eRes.json())
    setClients(await cRes.json())
  }, [])

  useEffect(() => { load() }, [load])

  const addIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/finances/income', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...incomeForm, client_id: incomeForm.client_id ? Number(incomeForm.client_id) : null, amount: Number(incomeForm.amount) }) })
    setShowIncomeModal(false)
    setIncomeForm({ client_id: '', amount: '', category: 'design', description: '', date: new Date().toISOString().split('T')[0] })
    load()
  }

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/finances/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...expenseForm, amount: Number(expenseForm.amount) }) })
    setShowExpenseModal(false)
    setExpenseForm({ amount: '', category: 'general', description: '', vendor: '', date: new Date().toISOString().split('T')[0] })
    load()
  }

  const deleteIncome = async (id: number) => { await fetch(`/api/finances/income?id=${id}`, { method: 'DELETE' }); load() }
  const deleteExpense = async (id: number) => { await fetch(`/api/finances/expenses?id=${id}`, { method: 'DELETE' }); load() }

  const tooltipStyle = { contentStyle: { background: '#1a1a27', border: '1px solid #32324a', borderRadius: '8px', color: '#e4e4e7' } }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Income', value: summary?.total_income || 0, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Total Expenses', value: summary?.total_expenses || 0, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Net Profit', value: summary?.net_profit || 0, icon: DollarSign, color: (summary?.net_profit || 0) >= 0 ? 'text-green-400' : 'text-red-400', bg: (summary?.net_profit || 0) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.bg}`}><s.icon size={24} className={s.color} /></div>
            <div>
              <p className="text-sm text-dark-300">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-white mb-4">Income vs Expenses</h3>
          {summary && summary.monthly_data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.monthly_data}>
                <XAxis dataKey="month" stroke="#6b6b8a" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b6b8a" tick={{ fontSize: 12 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-dark-400 text-sm text-center py-12">Add income or expenses to see the chart</p>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold text-white mb-4">Expense Breakdown</h3>
          {summary && summary.expense_categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={summary.expense_categories} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {summary.expense_categories.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-dark-400 text-sm text-center py-12">Add expenses to see the breakdown</p>
          )}
        </Card>
      </div>

      <Tabs tabs={[
        {
          id: 'income', label: 'Income',
          content: (
            <div className="space-y-4">
              <div className="flex justify-end"><Button onClick={() => setShowIncomeModal(true)}><Plus size={16} /> Add Income</Button></div>
              {incomeList.length === 0 ? <Card className="text-center py-8"><p className="text-dark-400">No income records</p></Card> : (
                <div className="space-y-2">
                  {incomeList.map((inc) => (
                    <Card key={inc.id} className="!p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white font-medium">{inc.description || inc.category}</p>
                        <p className="text-xs text-dark-400">{inc.client_name ? `${inc.client_name} · ` : ''}{formatDate(inc.date)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-green-400 font-semibold">+{formatCurrency(inc.amount)}</span>
                        <button onClick={() => deleteIncome(inc.id)} className="p-1 text-dark-400 hover:text-red-400 cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ),
        },
        {
          id: 'expenses', label: 'Expenses',
          content: (
            <div className="space-y-4">
              <div className="flex justify-end"><Button onClick={() => setShowExpenseModal(true)}><Plus size={16} /> Add Expense</Button></div>
              {expenseList.length === 0 ? <Card className="text-center py-8"><p className="text-dark-400">No expense records</p></Card> : (
                <div className="space-y-2">
                  {expenseList.map((exp) => (
                    <Card key={exp.id} className="!p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white font-medium">{exp.description || exp.category}</p>
                        <p className="text-xs text-dark-400">{exp.vendor ? `${exp.vendor} · ` : ''}{formatDate(exp.date)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-red-400 font-semibold">-{formatCurrency(exp.amount)}</span>
                        <button onClick={() => deleteExpense(exp.id)} className="p-1 text-dark-400 hover:text-red-400 cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ),
        },
      ]} />

      <Modal open={showIncomeModal} onClose={() => setShowIncomeModal(false)} title="Add Income">
        <form onSubmit={addIncome} className="space-y-4">
          <Input label="Amount *" type="number" min="0" step="0.01" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} required />
          <Select label="Category" value={incomeForm.category} onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })} options={INCOME_CATEGORIES.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} />
          <Input label="Description" value={incomeForm.description} onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })} />
          <Select label="Client" value={incomeForm.client_id} onChange={(e) => setIncomeForm({ ...incomeForm, client_id: e.target.value })} options={[{ value: '', label: 'None' }, ...clients.map((c) => ({ value: String(c.id), label: c.name }))]} />
          <Input label="Date *" type="date" value={incomeForm.date} onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} required />
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowIncomeModal(false)}>Cancel</Button><Button type="submit">Add Income</Button></div>
        </form>
      </Modal>

      <Modal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Add Expense">
        <form onSubmit={addExpense} className="space-y-4">
          <Input label="Amount *" type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
          <Select label="Category" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} />
          <Input label="Description" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
          <Input label="Vendor" value={expenseForm.vendor} onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })} />
          <Input label="Date *" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowExpenseModal(false)}>Cancel</Button><Button type="submit">Add Expense</Button></div>
        </form>
      </Modal>
    </div>
  )
}
