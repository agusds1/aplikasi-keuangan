'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { formatCurrency } from '@/lib/format'

type Data = {
  label: string
  income: number
  expense: number
}

export function TrendLineChart({ data }: { data: Data[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-sm text-muted-foreground">
        Belum ada data
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
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
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="income"
            name="Pemasukan"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="Pengeluaran"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}