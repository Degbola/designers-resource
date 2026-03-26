'use client'

import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

export function Sparkline({ data }: { data: { month: string; total: number }[] }) {
  if (!data || data.length === 0) return null

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
    itemStyle: { color: '#1A4332' },
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A4332" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#1A4332" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" hide />
        <Tooltip
          {...tooltipStyle}
          formatter={(v: number) =>
            new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)
          }
          labelFormatter={(l) => l}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#1A4332"
          strokeWidth={1.5}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 3, fill: '#1A4332' }}
          className="dark:[&>path]:stroke-[rgba(82,183,136,0.7)]"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
