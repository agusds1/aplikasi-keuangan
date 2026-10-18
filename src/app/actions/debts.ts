'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { debts, members, transactions, accounts, categories } from '@/lib/db/schema'
import { getActiveMemberId } from '@/lib/auth/session'
import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'

const debtSchema = z.object({
  name: z.string().min(1, 'Nama hutang wajib diisi'),
  principalAmount: z.coerce.number().positive(),
  interestRate: z.coerce.number().min(0).default(0),
  interestType: z.enum(['PERCENTAGE', 'FIXED']).default('PERCENTAGE'), // <-- BARU
  interestAmount: z.coerce.number().min(0).default(0), // <-- BARU
  tenorMonths: z.coerce.number().min(1),
  accountId: z.string().uuid('Pilih dompet penerima'),
})

export async function createDebtAction(input: {
  name: string
  principalAmount: number
  interestRate: number
  interestType: 'PERCENTAGE' | 'FIXED' // <-- BARU
  interestAmount: number // <-- BARU
  tenorMonths: number
  accountId: string
}) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  const parsed = debtSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    // 1. Simpan data hutang
    await db.insert(debts).values({
      familyId: member.familyId,
      memberId: member.id,
      name: parsed.data.name,
      principalAmount: parsed.data.principalAmount.toString(),
      remainingPrincipal: parsed.data.principalAmount.toString(),
      interestRate: parsed.data.interestRate.toString(),
      interestType: parsed.data.interestType, // <-- BARU
      interestAmount: parsed.data.interestAmount.toString(), // <-- BARU
      tenorMonths: parsed.data.tenorMonths,
    })

    // 2. Tambah saldo dompet penerima
    await db.update(accounts)
      .set({ currentBalance: sql`${accounts.currentBalance} + ${parsed.data.principalAmount}` })
      .where(eq(accounts.id, parsed.data.accountId))

    // 3. Catat transaksi sebagai LOAN_RECEIVE (Bukan Pemasukan)
    // Kita gunakan kategori "Hutang" pertama yang ada, atau buat ID dummy jika tidak ada
    // Idealnya kita punya kategori khusus, tapi untuk sekarang kita ambil sembarang ID kategori 'DEBT'
    const [category] = await db.select().from(categories).where(eq(categories.type, 'DEBT')).limit(1)

    await db.insert(transactions).values({
      familyId: member.familyId,
      categoryId: category?.id || '00000000-0000-0000-0000-000000000000', // Fallback
      accountId: parsed.data.accountId,
      memberId: member.id,
      amount: parsed.data.principalAmount.toString(),
      type: 'LOAN_RECEIVE',
      description: `Terima Pinjaman: ${parsed.data.name}`,
      date: new Date(),
    })

    revalidatePath('/debts')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    revalidatePath('/transactions')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal membuat data hutang' }
  }
}

export async function payDebtAction(
  debtId: string,
  input: {
    principalPaid: number
    interestPaid: number
    accountId: string
  }
) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  const totalPaid = input.principalPaid + input.interestPaid
  if (totalPaid <= 0) return { error: 'Total pembayaran harus lebih dari 0' }

  try {
    const [debt] = await db.select().from(debts).where(eq(debts.id, debtId)).limit(1)
    if (!debt) return { error: 'Data hutang tidak ditemukan' }

    const currentRemaining = parseFloat(debt.remainingPrincipal)
    if (input.principalPaid > currentRemaining) {
      return { error: 'Pembayaran pokok melebihi sisa hutang' }
    }

    // 1. Potong saldo dompet
    await db.update(accounts)
      .set({ currentBalance: sql`${accounts.currentBalance} - ${totalPaid}` })
      .where(eq(accounts.id, input.accountId))

    // 2. Kurangi sisa pokok hutang
    const newRemaining = currentRemaining - input.principalPaid
    await db.update(debts)
      .set({ 
        remainingPrincipal: newRemaining.toString(),
        isActive: newRemaining <= 0 ? false : true 
      })
      .where(eq(debts.id, debtId))

    // 3. Catat transaksi Pokok (TRANSFER)
    if (input.principalPaid > 0) {
      let [catPokok] = await db.select().from(categories).where(eq(categories.type, 'DEBT')).limit(1)
      
      // Jika kategori DEBT belum ada, buat otomatis
      if (!catPokok) {
        const [newCat] = await db.insert(categories).values({
          familyId: member.familyId, name: 'Bayar Hutang', type: 'DEBT', icon: '💳'
        }).returning()
        catPokok = newCat
      }

      await db.insert(transactions).values({
        familyId: member.familyId,
        categoryId: catPokok.id,
        accountId: input.accountId,
        memberId: member.id,
        amount: input.principalPaid.toString(),
        type: 'TRANSFER',
        description: `Bayar Pokok: ${debt.name}`,
        date: new Date(),
      })
    }

    // 4. Catat transaksi Bunga (EXPENSE)
    if (input.interestPaid > 0) {
      let [catBunga] = await db.select().from(categories).where(eq(categories.name, 'Bunga')).limit(1)
      
      // Jika kategori Bunga belum ada, buat otomatis
      if (!catBunga) {
        const [newCat] = await db.insert(categories).values({
          familyId: member.familyId, name: 'Bunga', type: 'EXPENSE', icon: '📈'
        }).returning()
        catBunga = newCat
      }

      await db.insert(transactions).values({
        familyId: member.familyId,
        categoryId: catBunga.id,
        accountId: input.accountId,
        memberId: member.id,
        amount: input.interestPaid.toString(),
        type: 'EXPENSE',
        description: `Bayar Bunga: ${debt.name}`,
        date: new Date(),
      })
    }

    revalidatePath('/debts')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    revalidatePath('/transactions')
    return { success: true }
  } catch (err: any) {
    console.error('PAY DEBT ERROR:', err)
    // Mengembalikan pesan error database yang sebenarnya agar mudah dilacak
    return { error: err.message || 'Gagal memproses pembayaran hutang' }
  }
}

export async function deleteDebtAction(debtId: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  try {
    await db.delete(debts).where(
      and(eq(debts.id, debtId), eq(debts.familyId, member.familyId))
    )
    revalidatePath('/debts')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal menghapus data hutang' }
  }
}