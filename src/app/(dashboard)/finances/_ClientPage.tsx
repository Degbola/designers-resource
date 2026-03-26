'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { Plus, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useCurrency } from '@/lib/currency-context'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import type { Income, Expense, FinanceSummary, Client } from '@/types'

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4']
const INCOME_CATEGORIES = ['design', 'development', 'consulting', 'branding', 'illustration', 'other']
const EXPENSE_CATEGORIES = ['software', 'hardware', 'office', 'marketing', 'education', 'travel', 'utilities', 'general']
const ENTRY_CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD', 'JPY', 'CHF', 'INR']

export function FinancesClientPage({ initialSummary, initialIncome, initialExpenses, initialClients }: {
  initialSummary: FinanceSummary
  initialIncome: Income[]
  initialExpenses: Expense[]
  initialClients: Client[]
}) {
  const router = useRouter()
  const { format, rates } = useCurrency()
  const fmt = (amount: number) => format(amount, 'NGN')

  // Convert any currency to NGN using live rates (locked in at submission time)
  const toNGN = (amount: number, currency: string): number => {
    if (currency === 'NGN') return amount
    if (!rates[currency] || !rates['NGN']) return amount
    return (amount / rates[currency]) * rates['NGN']
  }
  const fmtNGN = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(n)

  const [summary, setSummary] = useState<FinanceSummary>(initialSummary)
  const [incomeList, setIncomeList] = useState(initialIncome)
  const [expenseList, setExpenseList] = useState(initialExpenses)
  const [clients, setClients] = useState(initialClients)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [incomeForm, setIncomeForm] = useState({ client_id: '', amount: '', currency: 'NGN', category: 'design', description: '', date: new Date().toISOString().split('T')[0] })
  const [expenseForm, setExpenseForm] = useState({ amount: '', currency: 'NGN', category: 'general', description: '', vendor: '', date: new Date().toISOString().split('T')[0] })

  const load = useCallback(async () => {
    const [sRes, iRes, eRes, cRes] = await Promise.all([
      fetch('/api/finances/summary'), fetch('/api/finances/income'),
      fetch('/api/finances/expenses'), fetch('/api/clients'),
    ])
    if (sRes.ok) setSummary(await sRes.json())
    if (iRes.ok) setIncomeList(await iRes.json())
    if (eRes.ok) setExpenseList(await eRes.json())
    if (cRes.ok) setClients(await cRes.json())
    router.refresh()
  }, [router])

  const addIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    const ngnAmount = toNGN(Number(incomeForm.amount), incomeForm.currency)
    await fetch('/api/finances/income', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...incomeForm, client_id: incomeForm.client_id ? Number(incomeForm.client_id) : null, amount: ngnAmount }) })
    setShowIncomeModal(false)
    setIncomeForm({ client_id: '', amount: '', currency: 'NGN', category: 'design', description: '', date: new Date().toISOString().split('T')[0] })
    load()
  }

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const ngnAmount = toNGN(Number(expenseForm.amount), expenseForm.currency)
    await fetch('/api/finances/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...expenseForm, amount: ngnAmount }) })
    setShowExpenseModal(false)
    setExpenseForm({ amount: '', currency: 'NGN', category: 'general', description: '', vendor: '', date: new Date().toISOString().split('T')[0] })
    load()
  }

  const deleteIncome = async (id: number) => { await fetch(`/api/finances/income?id=${id}`, { method: 'DELETE' }); load() }
  const deleteExpense = async (id: number) => { await fetch(`/api/finances/expenses?id=${id}`, { method: 'DELETE' }); load() }

  const tooltipStyle = { contentStyle: { background: '#FDFCFA', border: '0.5px solid #E2DDD8', borderRadius: '0', color: '#111008', fontFamily: 'var(--font-inter)' } }
  const netProfit = summary?.net_profit || 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Income', value: summary?.total_income || 0, color: 'text-accent' },
          { label: 'Total Expenses', value: summary?.total_expenses || 0, color: 'text-red-500' },
          { label: 'Net Profit', value: netProfit, color: netProfit >= 0 ? 'text-accent' : 'text-red-500' },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-400 mb-1">{s.label}</p>
            <p className={`font-serif text-2xl font-normal ${s.color}`}>{fmt(s.value)}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-serif text-base font-normal text-dark-100 mb-4">Income vs Expenses</h3>
          {summary && summary.monthly_data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.monthly_data}>
                <XAxis dataKey="month" stroke="#8494a7" tick={{ fontSize: 11, fill: '#8494a7', fontFamily: 'var(--font-inter)' }} />
                <YAxis stroke="#8494a7" tick={{ fontSize: 11, fill: '#8494a7', fontFamily: 'var(--font-inter)' }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="income" fill="#1A4332" radius={[0, 0, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[0, 0, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-10 text-center"><p className="font-serif text-sm italic text-dark-400">Add income or expenses to see the chart.</p></div>
          )}
        </Card>
        <Card>
          <h3 className="font-serif text-base font-normal text-dark-100 mb-4">Expense Breakdown</h3>
          {summary && summary.expense_categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={summary.expense_categories} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {summary.expense_categories.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-10 text-center"><p className="font-serif text-sm italic text-dark-400">Add expenses to see the breakdown.</p></div>
          )}
        </Card>
      </div>

      <Tabs tabs={[
        {
          id: 'income', label: 'Income',
          content: (
            <div className="space-y-4">
              <div className="flex justify-end"><Button onClick={() => setShowIncomeModal(true)}><Plus size={16} /> Add Income</Button></div>
              {incomeList.length === 0 ? (
                <button type="button" onClick={() => setShowIncomeModal(true)} className="w-full text-left group cursor-pointer">
                  <div className="flex items-end justify-between px-6 py-8 rounded-md bg-accent group-hover:bg-accent-hover transition-all duration-300 group-hover:-translate-y-0.5">
                    <div><span className="text-[9px] font-display font-semibold uppercase tracking-[0.14em] text-white/50 block mb-3">Get Started</span><span className="font-serif text-[1.2rem] font-normal text-white leading-snug">Record your first income.</span></div>
                    <Plus size={22} className="text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0 ml-4" />
                  </div>
                </button>
              ) : (
                <div className="space-y-2">
                  {incomeList.map((inc) => (
                    <Card key={inc.id} className="!p-3 flex items-center justify-between">
                      <div><p className="text-sm text-dark-100 font-medium">{inc.description || inc.category}</p><p className="text-xs text-dark-400">{inc.client_name ? `${inc.client_name} · ` : ''}{formatDate(inc.date)}</p></div>
                      <div className="flex items-center gap-3"><span className="font-serif text-accent">+{fmt(inc.amount)}</span><button onClick={() => deleteIncome(inc.id)} className="p-1 text-dark-400 hover:text-red-500 cursor-pointer"><Trash2 size={14} /></button></div>
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
              {expenseList.length === 0 ? (
                <button type="button" onClick={() => setShowExpenseModal(true)} className="w-full text-left group cursor-pointer">
                  <div className="flex items-end justify-between px-6 py-8 rounded-md bg-accent group-hover:bg-accent-hover transition-all duration-300 group-hover:-translate-y-0.5">
                    <div><span className="text-[9px] font-display font-semibold uppercase tracking-[0.14em] text-white/50 block mb-3">Get Started</span><span className="font-serif text-[1.2rem] font-normal text-white leading-snug">Log your first expense.</span></div>
                    <Plus size={22} className="text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0 ml-4" />
                  </div>
                </button>
              ) : (
                <div className="space-y-2">
                  {expenseList.map((exp) => (
                    <Card key={exp.id} className="!p-3 flex items-center justify-between">
                      <div><p className="text-sm text-dark-100 font-medium">{exp.description || exp.category}</p><p className="text-xs text-dark-400">{exp.vendor ? `${exp.vendor} · ` : ''}{formatDate(exp.date)}</p></div>
                      <div className="flex items-center gap-3"><span className="font-serif text-red-500">-{fmt(exp.amount)}</span><button onClick={() => deleteExpense(exp.id)} className="p-1 text-dark-400 hover:text-red-500 cursor-pointer"><Trash2 size={14} /></button></div>
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
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount *" type="number" min="0" step="0.01" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} required />
            <Select label="Currency" value={incomeForm.currency} onChange={(e) => setIncomeForm({ ...incomeForm, currency: e.target.value })} options={ENTRY_CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </div>
          {incomeForm.currency !== 'NGN' && Number(incomeForm.amount) > 0 && (
            <p className="text-xs text-dark-400 -mt-2">
              = {fmtNGN(toNGN(Number(incomeForm.amount), incomeForm.currency))} saved at today's rate
            </p>
          )}
          <Select label="Category" value={incomeForm.category} onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })} options={INCOME_CATEGORIES.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} />
          <Input label="Description" value={incomeForm.description} onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })} />
          <Select label="Client" value={incomeForm.client_id} onChange={(e) => setIncomeForm({ ...incomeForm, client_id: e.target.value })} options={[{ value: '', label: 'None' }, ...clients.map((c) => ({ value: String(c.id), label: c.name }))]} />
          <Input label="Date *" type="date" value={incomeForm.date} onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} required />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowIncomeModal(false)}>Cancel</Button>
            <Button type="submit">Add Income</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Add Expense">
        <form onSubmit={addExpense} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount *" type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
            <Select label="Currency" value={expenseForm.currency} onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })} options={ENTRY_CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </div>
          {expenseForm.currency !== 'NGN' && Number(expenseForm.amount) > 0 && (
            <p className="text-xs text-dark-400 -mt-2">
              = {fmtNGN(toNGN(Number(expenseForm.amount), expenseForm.currency))} saved at today's rate
            </p>
          )}
          <Select label="Category" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} />
          <Input label="Description" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
          <Input label="Vendor" value={expenseForm.vendor} onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })} />
          <Input label="Date *" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
            <Button type="submit">Add Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
