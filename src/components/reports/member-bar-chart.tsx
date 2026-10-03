'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/format'

type Data = {
  memberName: string
  memberAvatar: string
  memberColor: string
  total: number
}

export function MemberBarChart({ data }: { data: Data[] }) {
  if (data.length === 0 || data.every((d) => d.total === 0)) {
    return (
      <div className="flex items-center justify-center h-56 text-sm text-muted-foreground">
        Belum ada pengeluaran bulan ini
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: d.memberName,
    avatar: d.memberAvatar,
    value: d.total,
    color: d.memberColor,
  }))

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrency(v, true).replace('Rp', '')}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}