'use client'

import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

const fmtNGN = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

const tooltipStyle = {
  contentStyle: {
    background: '#FDFCFA',
    border: '0.5px solid #E2DDD8',
    borderRadius: '0',
    color: '#111008',
    fontFamily: 'var(--font-inter)',
    fontSize: '11px',
    padding: '4px 8px',
  },
}

export function Sparkline({ data }: { data: { month: string; income: number; expenses: number }[] }) {
  if (!data || data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A4332" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#1A4332" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" hide />
        <Tooltip
          {...tooltipStyle}
          formatter={(v: number, name: string) => [fmtNGN(v), name === 'income' ? 'Income' : 'Expenses']}
          labelFormatter={(l) => l}
        />
        <Area type="monotone" dataKey="income" stroke="#1A4332" strokeWidth={1.5} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 3, fill: '#1A4332' }} />
        <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={1.5} fill="url(#expensesGrad)" dot={false} activeDot={{ r: 3, fill: '#ef4444' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
