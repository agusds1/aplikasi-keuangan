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
// ENUMS
// ============================================

export const memberRoleEnum = pgEnum('member_role', [
  'HUSBAND',
  'WIFE',
  'CHILD',
  'OTHER',
])

export const categoryTypeEnum = pgEnum('category_type', [
  'INCOME',      // Pemasukan
  'EXPENSE',     // Pengeluaran rutin
  'SAVING',      // Tabungan
  'DEBT',        // Bayar hutang
  'INVESTMENT',  // Investasi
  'SOCIAL',      // Donasi/sosial
])

export const transactionTypeEnum = pgEnum('transaction_type', [
  'INCOME',    // Uang masuk
  'EXPENSE',   // Uang keluar
  'TRANSFER',  // Pindah antar pos
])

// ============================================
// TABLES
// ============================================

// Akun login (1 akun shared untuk keluarga)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Keluarga
export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  currency: text('currency').default('IDR').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Anggota keluarga (profil di dalam 1 akun)
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

// Kategori / pos keuangan
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

// Alokasi per bulan per kategori
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

// Transaksi
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
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  toCategoryId: uuid('to_category_id').references(() => categories.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Hutang
export const debts = pgTable('debts', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  remaining: decimal('remaining', { precision: 15, scale: 2 }).notNull(),
  monthlyPayment: decimal('monthly_payment', {
    precision: 15,
    scale: 2,
  }).notNull(),
  dueDate: integer('due_date'),
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Target tabungan
export const savingsGoals = pgTable('savings_goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  targetAmount: decimal('target_amount', {
    precision: 15,
    scale: 2,
  }).notNull(),
  currentAmount: decimal('current_amount', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  targetDate: timestamp('target_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// RELATIONS
// ============================================

export const familiesRelations = relations(families, ({ many }) => ({
  members: many(members),
  categories: many(categories),
  transactions: many(transactions),
  debts: many(debts),
  savingsGoals: many(savingsGoals),
}))

export const membersRelations = relations(members, ({ one, many }) => ({
  family: one(families, {
    fields: [members.familyId],
    references: [families.id],
  }),
  transactions: many(transactions),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  family: one(families, {
    fields: [categories.familyId],
    references: [families.id],
  }),
  transactions: many(transactions),
  allocations: many(allocations),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  family: one(families, {
    fields: [transactions.familyId],
    references: [families.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
    relationName: 'transactionCategory',
  }),
  member: one(members, {
    fields: [transactions.memberId],
    references: [members.id],
  }),
}))

export const allocationsRelations = relations(allocations, ({ one }) => ({
  category: one(categories, {
    fields: [allocations.categoryId],
    references: [categories.id],
  }),
}))

export const debtsRelations = relations(debts, ({ one }) => ({
  family: one(families, {
    fields: [debts.familyId],
    references: [families.id],
  }),
}))

export const savingsGoalsRelations = relations(savingsGoals, ({ one }) => ({
  family: one(families, {
    fields: [savingsGoals.familyId],
    references: [families.id],
  }),
}))

// ============================================
// TYPES (infer dari schema)
// ============================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Family = typeof families.$inferSelect
export type NewFamily = typeof families.$inferInsert
export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Debt = typeof debts.$inferSelect
export type NewDebt = typeof debts.$inferInsert
export type SavingsGoal = typeof savingsGoals.$inferSelect
export type NewSavingsGoal = typeof savingsGoals.$inferInsert
export type Allocation = typeof allocations.$inferSelect
export type NewAllocation = typeof allocations.$inferInsert