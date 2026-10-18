import { db } from './index'
import { transactions, accounts, families } from './schema'
import { eq } from 'drizzle-orm'

async function migrate() {
  console.log('🚀 Memulai migrasi data...')

  // 1. Ambil semua keluarga
  const allFamilies = await db.select().from(families)
  
  for (const family of allFamilies) {
    console.log(`\nMemproses Keluarga: ${family.name}`)

    // 2. Buat Dompet Default "Kas Utama"
    const [defaultAccount] = await db.insert(accounts).values({
      familyId: family.id,
      name: 'Kas Utama',
      type: 'CASH',
      initialBalance: '0',
      currentBalance: '0',
    }).returning()
    console.log(`✅ Dompet default dibuat: ${defaultAccount.id}`)

    // 3. Update semua transaksi lama agar masuk ke Dompet "Kas Utama"
    await db.update(transactions)
      .set({ accountId: defaultAccount.id })
      .where(eq(transactions.familyId, family.id))
    
    console.log(`✅ Semua transaksi lama dipindahkan ke Kas Utama`)
  }

  console.log('\n🎉 Migrasi Selesai!')
  process.exit(0)
}

migrate().catch(console.error)