import {
  pgTable,
  text,
  timestamp,
  decimal,
  boolean,
  integer,
  pgEnum,
  uuid,
  unique,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================
// ENUMS (YANG BARU)
// ============================================

export const memberRoleEnum = pgEnum('member_role', [
  'HUSBAND',
  'WIFE',
  'CHILD',
  'OTHER',
])

export const categoryTypeEnum = pgEnum('category_type', [
  'INCOME',
  'EXPENSE',
  'SAVING',
  'INVESTMENT',
  'DEBT',
  'SOCIAL',
])

export const transactionTypeEnum = pgEnum('transaction_type', [
  'INCOME',       // Pemasukan riil
  'EXPENSE',      // Pengeluaran riil (konsumsi, bunga)
  'TRANSFER',     // Pindah pos (Nabung, Beli Aset, Bayar Pokok)
  'LOAN_RECEIVE', // Terima pinjaman
  'ASSET_SALE',   // Jual aset
])

export const accountTypeEnum = pgEnum('account_type', [
  'CASH',
  'BANK',
  'EWALLET',
])

export const assetTypeEnum = pgEnum('asset_type', [
  'VEHICLE',
  'PROPERTY',
  'GOLD',
  'INVESTMENT',
  'OTHER',
])

// ============================================
// TABEL BARU: ACCOUNTS (DOMPET)
// ============================================
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // "BCA", "Dompet Suami"
  type: accountTypeEnum('type').notNull().default('BANK'),
  initialBalance: decimal('initial_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  currentBalance: decimal('current_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// TABEL BARU: ASSETS (ASET)
// ============================================
export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // "Emas Antam", "Motor Vario"
  type: assetTypeEnum('type').notNull().default('OTHER'),
  purchaseValue: decimal('purchase_value', { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).notNull(),
  purchaseDate: timestamp('purchase_date').defaultNow().notNull(),
  isLiquid: boolean('is_liquid').default(false).notNull(), // Bisa cepat dijual?
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// TABEL UPDATE
// ============================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  currency: text('currency').default('IDR').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: memberRoleEnum('role').notNull(),
  avatar: text('avatar').default('👤').notNull(),
  color: text('color').default('#3b82f6').notNull(),
  pinHash: text('pin_hash'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: categoryTypeEnum('type').notNull(),
  icon: text('icon').default('📁').notNull(),
  color: text('color').default('#64748b').notNull(),
  isFixed: boolean('is_fixed').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const allocations = pgTable(
  'allocations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    period: text('period').notNull(),
    plannedAmount: decimal('planned_amount', {
      precision: 15,
      scale: 2,
    }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueCategoryPeriod: unique().on(table.categoryId, table.period),
  })
)

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id),
  accountId: uuid('account_id') // Dompet sumber/utama
    .references(() => accounts.id),
  targetAccountId: uuid('target_account_id') // Untuk transfer antar dompet
    .references(() => accounts.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  toCategoryId: uuid('to_category_id').references(() => categories.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const debts = pgTable('debts', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  principalAmount: decimal('principal_amount', { precision: 15, scale: 2 }).notNull(),
  remainingPrincipal: decimal('remaining_principal', { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }),
  startDate: timestamp('start_date').defaultNow().notNull(),
  tenorMonths: integer('tenor_months'),
  dueDate: integer('due_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const savingsGoals = pgTable('savings_goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  targetAmount: decimal('target_amount', { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal('current_amount', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  targetDate: timestamp('target_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const transactionPlans = pgTable('transaction_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => members.id),
  reviewerId: uuid('reviewer_id')
    .notNull()
    .references(() => members.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  description: text('description'),
  plannedDate: timestamp('planned_date').notNull(),
  status: text('status').default('PENDING').notNull(), // PENDING, APPROVED, REVISION, REJECTED, EXECUTED
  reviewNote: text('review_note'),
  reviewedAt: timestamp('reviewed_at'),
  executedTransactionId: uuid('executed_transaction_id').references(
    () => transactions.id,
    { onDelete: 'set null' }
  ),
  executedAt: timestamp('executed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// RELATIONS (TAMBAHAN)
// ============================================

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  family: one(families, { fields: [accounts.familyId], references: [families.id] }),
  transactions: many(transactions),
}))

export const assetsRelations = relations(assets, ({ one }) => ({
  family: one(families, { fields: [assets.familyId], references: [families.id] }),
}))

// ... (Relations lain biarkan sama seperti sebelumnya)
export const familiesRelations = relations(families, ({ many }) => ({
  members: many(members),
  categories: many(categories),
  transactions: many(transactions),
  debts: many(debts),
  savingsGoals: many(savingsGoals),
  accounts: many(accounts),
  assets: many(assets),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  family: one(families, { fields: [transactions.familyId], references: [families.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id], relationName: 'transactionCategory' }),
  member: one(members, { fields: [transactions.memberId], references: [members.id] }),
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id], relationName: 'sourceAccount' }),
  targetAccount: one(accounts, { fields: [transactions.targetAccountId], references: [accounts.id], relationName: 'targetAccount' }),
}))

// ============================================
// TYPES (infer dari schema)
// ============================================

export type User = typeof users.$inferSelect
export type Family = typeof families.$inferSelect
export type Member = typeof members.$inferSelect
export type Category = typeof categories.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type Debt = typeof debts.$inferSelect
export type SavingsGoal = typeof savingsGoals.$inferSelect
export type Allocation = typeof allocations.$inferSelect
export type TransactionPlan = typeof transactionPlans.$inferSelect

// 👇 Tambahkan dua baris ini untuk Dompet & Aset
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type Asset = typeof assets.$inferSelect
export type NewAsset = typeof assets.$inferInsert