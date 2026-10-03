import { db } from './index'
import { users, families, members, categories } from './schema'
import bcrypt from 'bcryptjs'


async function seed() {
  console.log('🌱 Mulai seeding...')

  // ============================
  // 1. Buat akun login keluarga
  // ============================
  const passwordHash = await bcrypt.hash('keluarga123', 10)

  const [user] = await db
    .insert(users)
    .values({
      email: 'keluarga@example.com',
      passwordHash,
    })
    .returning()

  console.log('✅ User dibuat:', user.email)

  // ============================
  // 2. Buat keluarga
  // ============================
  const [family] = await db
    .insert(families)
    .values({
      name: 'Keluarga Kami',
      currency: 'IDR',
    })
    .returning()

  console.log('✅ Keluarga dibuat:', family.name)

  // ============================
  // 3. Buat 2 member: Suami & Istri
  // ============================
  const [suami, istri] = await db
    .insert(members)
    .values([
      {
        familyId: family.id,
        name: 'Suami',
        role: 'HUSBAND',
        avatar: '👨',
        color: '#3b82f6', // biru
      },
      {
        familyId: family.id,
        name: 'Istri',
        role: 'WIFE',
        avatar: '👩',
        color: '#ec4899', // pink
      },
    ])
    .returning()

  console.log('✅ Member dibuat:', suami.name, '&', istri.name)

  // ============================
  // 4. Buat kategori default
  // ============================
  await db.insert(categories).values([
    // Pemasukan
    {
      familyId: family.id,
      name: 'Gaji',
      type: 'INCOME',
      icon: '💰',
      color: '#10b981',
      sortOrder: 1,
    },
    {
      familyId: family.id,
      name: 'Bonus / Freelance',
      type: 'INCOME',
      icon: '🎁',
      color: '#10b981',
      sortOrder: 2,
    },
    // Pengeluaran rutin
    {
      familyId: family.id,
      name: 'Belanja Bulanan',
      type: 'EXPENSE',
      icon: '🍚',
      color: '#f59e0b',
      isFixed: false,
      sortOrder: 10,
    },
    {
      familyId: family.id,
      name: 'Transportasi',
      type: 'EXPENSE',
      icon: '🚗',
      color: '#f59e0b',
      isFixed: false,
      sortOrder: 11,
    },
    {
      familyId: family.id,
      name: 'Listrik & Air',
      type: 'EXPENSE',
      icon: '💡',
      color: '#f59e0b',
      isFixed: true,
      sortOrder: 12,
    },
    {
      familyId: family.id,
      name: 'Internet & Pulsa',
      type: 'EXPENSE',
      icon: '📱',
      color: '#f59e0b',
      isFixed: true,
      sortOrder: 13,
    },
    {
      familyId: family.id,
      name: 'Pendidikan Anak',
      type: 'EXPENSE',
      icon: '📚',
      color: '#f59e0b',
      isFixed: true,
      sortOrder: 14,
    },
    // Tabungan
    {
      familyId: family.id,
      name: 'Dana Darurat',
      type: 'SAVING',
      icon: '🏦',
      color: '#06b6d4',
      sortOrder: 20,
    },
    {
      familyId: family.id,
      name: 'Tabungan Pendidikan',
      type: 'SAVING',
      icon: '🎓',
      color: '#06b6d4',
      sortOrder: 21,
    },
    // Investasi
    {
      familyId: family.id,
      name: 'Investasi',
      type: 'INVESTMENT',
      icon: '📈',
      color: '#8b5cf6',
      sortOrder: 30,
    },
    // Hutang
    {
      familyId: family.id,
      name: 'Bayar Hutang',
      type: 'DEBT',
      icon: '💳',
      color: '#ef4444',
      sortOrder: 40,
    },
    // Sosial
    {
      familyId: family.id,
      name: 'Donasi / Zakat',
      type: 'SOCIAL',
      icon: '🤲',
      color: '#14b8a6',
      sortOrder: 50,
    },
  ])

  console.log('✅ 12 kategori default dibuat')

  console.log('\n🎉 Seeding selesai!')
  console.log('\n📋 Info Login:')
  console.log('   Email    : keluarga@example.com')
  console.log('   Password : keluarga123')
  console.log('\n👥 Member:')
  console.log('   - Suami (👨)')
  console.log('   - Istri (👩)')

  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed gagal:', err)
  process.exit(1)
})