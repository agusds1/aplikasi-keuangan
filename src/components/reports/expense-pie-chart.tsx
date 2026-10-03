'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { formatCurrency } from '@/lib/format'

type Data = {
  categoryName: string
  categoryIcon: string
  categoryColor: string
  total: number
}

export function ExpensePieChart({ data }: { data: Data[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Belum ada pengeluaran bulan ini
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: d.categoryName,
    value: d.total,
    color: d.categoryColor,
    icon: d.categoryIcon,
  }))

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="space-y-4">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-1.5">
        {chartData.map((d, i) => {
          const percentage = ((d.value / total) * 100).toFixed(1)
          return (
            <div
              key={i}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="truncate">
                  {d.icon} {d.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-medium">
                  {formatCurrency(d.value, true)}
                </span>
                <span className="text-muted-foreground w-12 text-right">
                  {percentage}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}