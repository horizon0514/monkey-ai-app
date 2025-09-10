import { Database } from 'better-sqlite3'
import BetterSqlite3 from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { app } from 'electron'
import { mkdirSync } from 'fs'
import { join } from 'path'
import {
  conversations,
  messages,
  type ConversationRow,
  type InsertConversationRow
  // type InsertMessageRow,
  // type MessageRow
} from './schema'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
}

let sqlite: Database | null = null
let db: ReturnType<typeof drizzle> | null = null

export function getDbPath(): string {
  // In development, store DB under project directory for easier inspection
  if (!app.isPackaged) {
    const base = app.getAppPath()
    const dir = join(base, 'dev-db')
    try {
      mkdirSync(dir, { recursive: true })
    } catch {
      // ignore
    }
    return join(dir, 'chat.sqlite3')
  }
  // In production, use userData directory
  const userData = app.getPath('userData')
  return join(userData, 'chat.sqlite3')
}

export function initDb(): void {
  if (db) return
  const file = getDbPath()
  sqlite = new BetterSqlite3(file)
  db = drizzle(sqlite!)
  // ensure tables exist
  sqlite!.exec(
    `CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );`
  )
  sqlite!.exec(
    `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      idx INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );`
  )
}

export function createConversation(title?: string): ConversationRow {
  if (!db) throw new Error('DB_NOT_INITIALIZED')
  const now = Date.now()
  const row: InsertConversationRow = {
    id: randomUUID(),
    title: title || 'New Chat',
    createdAt: now as unknown as any,
    updatedAt: now as unknown as any
  }
  db.insert(conversations).values(row).run()
  return row as ConversationRow
}

export function listConversations(): ConversationRow[] {
  if (!db) throw new Error('DB_NOT_INITIALIZED')
  return db.select().from(conversations).orderBy(conversations.createdAt).all()
}

export function deleteConversation(conversationId: string): void {
  if (!db) throw new Error('DB_NOT_INITIALIZED')
  db.delete(messages).where(eq(messages.conversationId, conversationId)).run()
  db.delete(conversations).where(eq(conversations.id, conversationId)).run()
}

export function upsertMessages(
  conversationId: string,
  uiMessages: ChatMessage[]
): void {
  if (!db) throw new Error('DB_NOT_INITIALIZED')
  const now = Date.now()
  const tx = sqlite!.transaction((msgs: ChatMessage[]) => {
    // delete existing
    sqlite!
      .prepare('DELETE FROM messages WHERE conversation_id = ?')
      .run(conversationId)
    // insert
    const stmt = sqlite!.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, idx, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    msgs.forEach((m, i) => {
      stmt.run(m.id || randomUUID(), conversationId, m.role, m.text, i, now)
    })
  })
  tx(uiMessages)
}

export function getConversationMessages(conversationId: string): ChatMessage[] {
  if (!db) throw new Error('DB_NOT_INITIALIZED')
  const rows = db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.orderIndex)
    .all()
  return rows.map(r => ({ id: r.id, role: r.role as any, text: r.content }))
}

export function renameConversation(
  conversationId: string,
  title: string
): void {
  if (!db) throw new Error('DB_NOT_INITIALIZED')
  db.update(conversations)
    .set({ title, updatedAt: Date.now() })
    .where(eq(conversations.id, conversationId))
    .run()
}

export function ensureConversation(conversationId?: string): ConversationRow {
  if (!db) throw new Error('DB_NOT_INITIALIZED')
  if (conversationId) {
    const found = db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .get() as ConversationRow | undefined
    if (found) return found
  }
  return createConversation()
}

export function closeDb(): void {
  if (sqlite) {
    sqlite.close()
    sqlite = null
    db = null
  }
}
