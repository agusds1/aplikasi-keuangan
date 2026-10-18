'use client'

import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'

type CurrencyInputProps = Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> & {
  value: number | string
  onChange: (value: string) => void
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    // Format angka ke Rupiah (tanpa simbol Rp, hanya titik)
    const formattedValue = value
      ? new Intl.NumberFormat('id-ID').format(Number(value))
      : ''

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Hapus semua karakter selain angka
      const rawValue = e.target.value.replace(/\D/g, '')
      onChange(rawValue)
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={formattedValue}
        onChange={handleChange}
      />
    )
  }
)
CurrencyInput.displayName = 'CurrencyInput'