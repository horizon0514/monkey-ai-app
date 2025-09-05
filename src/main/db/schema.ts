import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  title: text('title'),
  model: text('model'),
  webSearch: integer('web_search', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  raw: text('raw'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

