'use client'

import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, ReferenceLine } from 'recharts'

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

  const chartData = data.map((d) => ({ month: d.month, net: d.income - d.expenses }))
  const hasNegative = chartData.some((d) => d.net < 0)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A4332" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#1A4332" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" hide />
        {hasNegative && <ReferenceLine y={0} stroke="rgba(0,0,0,0.15)" strokeDasharray="3 3" />}
        <Tooltip
          {...tooltipStyle}
          formatter={(v: number) => [fmtNGN(v), 'Net']}
          labelFormatter={(l) => l}
        />
        <Area
          type="monotone"
          dataKey="net"
          stroke="#1A4332"
          strokeWidth={1.5}
          fill="url(#netGrad)"
          dot={false}
          activeDot={{ r: 3, fill: '#1A4332' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
