import { formatCurrency } from '@/lib/format'

type MemberData = {
  memberId: string
  memberName: string
  memberAvatar: string
  memberColor: string
  total: number
}

export function MemberBreakdown({ data }: { data: MemberData[] }) {
  const grandTotal = data.reduce((sum, m) => sum + m.total, 0)

  if (grandTotal === 0) {
    return (
      <div className="rounded-xl bg-card border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Belum ada pengeluaran bulan ini
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((m) => {
        const percentage = grandTotal > 0 ? (m.total / grandTotal) * 100 : 0

        return (
          <div key={m.memberId} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: `${m.memberColor}30` }}
                >
                  {m.memberAvatar}
                </div>
                <span className="font-medium">{m.memberName}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">
                  {formatCurrency(m.total, true)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {Math.round(percentage)}%
                </p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: m.memberColor,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}