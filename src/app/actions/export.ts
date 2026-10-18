'use server'

import { db } from '@/lib/db'
import { transactions, categories, accounts, members, assets, debts } from '@/lib/db/schema'
import { getActiveMemberId } from '@/lib/auth/session'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { format } from 'date-fns'

// 1. LAPORAN TRANSAKSI DETAIL
export async function getTransactionCSVAction(month: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  const [year, m] = month.split('-').map(Number)
  const start = new Date(year, m - 1, 1)
  const end = new Date(year, m, 0, 23, 59, 59)

  try {
    const rows = await db
      .select({
        date: transactions.date, type: transactions.type, category: categories.name,
        account: accounts.name, description: transactions.description,
        amount: transactions.amount, member: members.name,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(members, eq(transactions.memberId, members.id))
      .where(and(eq(transactions.familyId, member.familyId), gte(transactions.date, start), lte(transactions.date, end)))
      .orderBy(desc(transactions.date))

    let csv = '\uFEFF' + 'Tanggal;Tipe;Kategori;Dompet;Keterangan;Nominal (Rp);Oleh\n'
    rows.forEach((row) => {
      const dateStr = format(new Date(row.date), 'dd/MM/yyyy')
      const desc = row.description ? `"${row.description.replace(/"/g, '""')}"` : ''
      csv += `${dateStr};${row.type};${row.category};${row.account};${desc};${parseFloat(row.amount)};${row.member}\n`
    })
    return { success: true, csv, filename: `Transaksi_${month}.csv` }
  } catch (err) { return { error: 'Gagal membuat laporan' } }
}

// 2. LAPORAN ARUS KAS (CASH FLOW)
export async function getCashFlowCSVAction(month: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  const [year, m] = month.split('-').map(Number)
  const start = new Date(year, m - 1, 1)
  const end = new Date(year, m, 0, 23, 59, 59)

  try {
    const rows = await db.select({ type: transactions.type, amount: transactions.amount })
      .from(transactions)
      .where(and(eq(transactions.familyId, member.familyId), gte(transactions.date, start), lte(transactions.date, end)))

    let income = 0, expense = 0, transfer = 0, loan = 0
    rows.forEach((r) => {
      const amt = parseFloat(r.amount)
      if (r.type === 'INCOME') income += amt
      else if (r.type === 'EXPENSE') expense += amt
      else if (r.type === 'TRANSFER') transfer += amt
      else if (r.type === 'LOAN_RECEIVE') loan += amt
    })

    let csv = `\uFEFFLaporan Arus Kas - ${month}\n\nKeterangan;Nominal (Rp)\n`
    csv += `Pemasukan Riil;${income}\nPengeluaran Riil;${expense}\nTabungan/Investasi;${transfer}\nPenerimaan Pinjaman;${loan}\n\n`
    csv += `Arus Kas Bersih;${(income + loan) - expense - transfer}\n`
    return { success: true, csv, filename: `ArusKas_${month}.csv` }
  } catch (err) { return { error: 'Gagal membuat laporan' } }
}

// 3. LAPORAN LABA/RUGI (SURPLUS/DEFISIT)
export async function getIncomeStatementCSVAction(month: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  const [year, m] = month.split('-').map(Number)
  const start = new Date(year, m - 1, 1)
  const end = new Date(year, m, 0, 23, 59, 59)

  try {
    const rows = await db.select({ type: transactions.type, amount: transactions.amount, catType: categories.type })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(eq(transactions.familyId, member.familyId), gte(transactions.date, start), lte(transactions.date, end)))

    let pemasukan = 0, pengeluaran = 0, tabungan = 0
    rows.forEach((r) => {
      const amt = parseFloat(r.amount)
      if (r.type === 'INCOME') pemasukan += amt
      else if (r.type === 'EXPENSE') pengeluaran += amt
      else if (r.type === 'TRANSFER' && (r.catType === 'SAVING' || r.catType === 'INVESTMENT')) tabungan += amt
    })

    const surplus = pemasukan - pengeluaran - tabungan

    let csv = `\uFEFFLaporan Laba/Rugi (Surplus/Defisit) - ${month}\n\nKeterangan;Nominal (Rp)\n`
    csv += `Pemasukan (Income);${pemasukan}\n`
    csv += `(-) Pengeluaran Konsumsi;${pengeluaran}\n`
    csv += `(-) Tabungan & Investasi;${tabungan}\n`
    csv += `--------------------------------\n`
    csv += `Surplus / (Defisit);${surplus}\n`
    return { success: true, csv, filename: `LabaRugi_${month}.csv` }
  } catch (err) { return { error: 'Gagal membuat laporan' } }
}

// 4. LAPORAN NERACA (KEKAYAAN BERSIH)
export async function getBalanceSheetCSVAction() {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)

  try {
    const accs = await db.select().from(accounts).where(eq(accounts.familyId, member.familyId))
    const assetList = await db.select().from(assets).where(and(eq(assets.familyId, member.familyId), eq(assets.isActive, true)))
    const debtList = await db.select().from(debts).where(and(eq(debts.familyId, member.familyId), eq(debts.isActive, true)))

    const totalKas = accs.reduce((s, a) => s + parseFloat(a.currentBalance), 0)
    const totalAset = assetList.reduce((s, a) => s + parseFloat(a.currentValue), 0)
    const totalHutang = debtList.reduce((s, d) => s + parseFloat(d.remainingPrincipal), 0)
    const netWorth = (totalKas + totalAset) - totalHutang

    const today = format(new Date(), 'dd/MM/yyyy')

    let csv = `\uFEFFLaporan Posisi Keuangan (Neraca) - ${today}\n\n`
    csv += `Keterangan;Nominal (Rp)\n`
    
    // ASET LANCAR
    csv += `ASET LANCAR (KAS & BANK);\n`
    accs.forEach(a => { csv += `"${a.name}";${parseFloat(a.currentBalance)}\n` }) // Pakai tanda kutip agar tidak jadi rumus
    csv += `Total Kas;${totalKas}\n\n`
    
    // ASET TIDAK LANCAR
    csv += `ASET TIDAK LANCAR;\n`
    assetList.forEach(a => { csv += `"${a.name}";${parseFloat(a.currentValue)}\n` })
    csv += `Total Aset;${totalAset}\n\n`

    // KEWAJIBAN
    csv += `KEWAJIBAN (HUTANG);\n`
    debtList.forEach(d => { csv += `"${d.name}";${parseFloat(d.remainingPrincipal)}\n` })
    csv += `Total Hutang;${totalHutang}\n\n`
    
    // NET WORTH
    csv += `================================;\n`
    csv += `KEKAYAAN BERSIH (NET WORTH);${netWorth}\n`

    return { success: true, csv, filename: `Neraca_${format(new Date(), 'yyyy-MM-dd')}.csv` }
  } catch (err) { return { error: 'Gagal membuat laporan' } }
}