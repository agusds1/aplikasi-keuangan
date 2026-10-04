import { defineConfig } from 'drizzle-kit'

// Untuk migration, pakai DIRECT_URL (port 5432)
// Fallback ke DATABASE_URL kalau tidak ada
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: migrationUrl!,
  },
  verbose: true,
  strict: true,
})