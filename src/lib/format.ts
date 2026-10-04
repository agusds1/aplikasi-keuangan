export function formatCurrency(
  amount: string | number | undefined | null,
  _compact = false // diabaikan, selalu tampilkan lengkap
) {
  const num =
    typeof amount === 'string'
      ? parseFloat(amount)
      : typeof amount === 'number'
        ? amount
        : 0

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}