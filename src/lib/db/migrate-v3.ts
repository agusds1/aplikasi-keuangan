import { db } from './index'
import { debts, assets, members } from './schema'
import { eq } from 'drizzle-orm'

async function migrate() {
  const [defaultMember] = await db.select().from(members).limit(1)
  if (!defaultMember) return console.log('Tidak ada member')
  
  console.log('Mengisi member_id untuk data lama...')
  await db.update(debts).set({ memberId: defaultMember.id }).where(eq(debts.memberId, null as any))
  await db.update(assets).set({ memberId: defaultMember.id }).where(eq(assets.memberId, null as any))
  
  console.log('Selesai!')
  process.exit(0)
}
migrate()