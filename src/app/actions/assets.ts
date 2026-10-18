'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { assets, members, transactions, accounts, categories } from '@/lib/db/schema'
import { getActiveMemberId } from '@/lib/auth/session'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

const assetSchema = z.object({
  name: z.string().min(1, 'Nama aset wajib diisi'),
  type: z.enum(['VEHICLE', 'PROPERTY', 'GOLD', 'INVESTMENT', 'OTHER']),
  purchaseValue: z.coerce.number().positive(),
})

export async function createAssetAction(input: {
  name: string
  type: 'VEHICLE' | 'PROPERTY' | 'GOLD' | 'INVESTMENT' | 'OTHER'
  purchaseValue: number
  accountId: string // Dompet sumber dana
}) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  const parsed = assetSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    // 1. Simpan Aset
    await db.insert(assets).values({
      familyId: member.familyId,
      name: parsed.data.name,
      type: parsed.data.type,
      purchaseValue: parsed.data.purchaseValue.toString(),
      currentValue: parsed.data.purchaseValue.toString(),
    })

    // 2. Potong saldo Dompet (Beli Aset = Transfer)
    await db.update(accounts)
      .set({ currentBalance: sql`${accounts.currentBalance} - ${parsed.data.purchaseValue}` })
      .where(eq(accounts.id, input.accountId))

    // 3. Catat Transaksi (TRANSFER, bukan pengeluaran)
    let [catAset] = await db.select().from(categories).where(eq(categories.name, 'Beli Aset')).limit(1)
    if (!catAset) {
      const [newCat] = await db.insert(categories).values({
        familyId: member.familyId, name: 'Beli Aset', type: 'INVESTMENT', icon: '📦'
      }).returning()
      catAset = newCat
    }

    await db.insert(transactions).values({
      familyId: member.familyId,
      categoryId: catAset.id,
      accountId: input.accountId,
      memberId: member.id,
      amount: parsed.data.purchaseValue.toString(),
      type: 'TRANSFER',
      description: `Beli Aset: ${parsed.data.name}`,
      date: new Date(),
    })

    revalidatePath('/assets')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    revalidatePath('/transactions')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal membuat data aset' }
  }
}

export async function sellAssetAction(
  assetId: string,
  input: { salePrice: number; accountId: string }
) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  if (input.salePrice <= 0) return { error: 'Harga jual tidak valid' }

  try {
    const [asset] = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1)
    if (!asset) return { error: 'Aset tidak ditemukan' }

    const purchaseValue = parseFloat(asset.purchaseValue)
    const salePrice = input.salePrice
    const profitLoss = salePrice - purchaseValue

    // 1. Nonaktifkan Aset
    await db.update(assets).set({ isActive: false }).where(eq(assets.id, assetId))

    // 2. Tambah saldo Dompet
    await db.update(accounts)
      .set({ currentBalance: sql`${accounts.currentBalance} + ${salePrice}` })
      .where(eq(accounts.id, input.accountId))

    // 3. Catat Transaksi Jual Aset (Uang masuk pokok)
    let [catJual] = await db.select().from(categories).where(eq(categories.name, 'Jual Aset')).limit(1)
    if (!catJual) {
      const [newCat] = await db.insert(categories).values({
        familyId: member.familyId, name: 'Jual Aset', type: 'INVESTMENT', icon: '💰'
      }).returning()
      catJual = newCat
    }

    await db.insert(transactions).values({
      familyId: member.familyId,
      categoryId: catJual.id,
      accountId: input.accountId,
      memberId: member.id,
      amount: purchaseValue.toString(),
      type: 'ASSET_SALE',
      description: `Jual Aset: ${asset.name}`,
      date: new Date(),
    })

    // 4. Catat Untung/Rugi
    if (profitLoss !== 0) {
      let [catUntung] = await db.select().from(categories).where(eq(categories.name, 'Untung/Rugi Aset')).limit(1)
      if (!catUntung) {
        const [newCat] = await db.insert(categories).values({
          familyId: member.familyId, name: 'Untung/Rugi Aset', type: profitLoss > 0 ? 'INCOME' : 'EXPENSE', icon: profitLoss > 0 ? '📈' : '📉'
        }).returning()
        catUntung = newCat
      }

      await db.insert(transactions).values({
        familyId: member.familyId,
        categoryId: catUntung.id,
        accountId: input.accountId,
        memberId: member.id,
        amount: Math.abs(profitLoss).toString(),
        type: profitLoss > 0 ? 'INCOME' : 'EXPENSE',
        description: `${profitLoss > 0 ? 'Untung' : 'Rugi'} Jual: ${asset.name}`,
        date: new Date(),
      })
    }

    revalidatePath('/assets')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    revalidatePath('/transactions')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal memproses penjualan aset' }
  }
}

export async function deleteAssetAction(assetId: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  try {
    await db.update(assets).set({ isActive: false }).where(eq(assets.id, assetId))
    revalidatePath('/assets')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return { error: 'Gagal menghapus aset' }
  }
}