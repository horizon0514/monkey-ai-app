import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/db/schema.ts',
  out: './drizzle',
  strict: true,
  dbCredentials: {
    // Only used by drizzle-kit for generating migrations; the app uses better-sqlite3 at runtime
    url: 'file:./drizzle/migrations.db'
  }
})

