export function formatCurrency(amount: string | number, compact = false) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(num)
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}