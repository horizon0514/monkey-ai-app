import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { mkdirSync } from 'fs'
import { join } from 'path'

const dbDir = join(process.resourcesPath || process.cwd(), 'data')
try {
  mkdirSync(dbDir, { recursive: true })
} catch {}

const dbPath = join(dbDir, 'chat.db')
const sqlite = new Database(dbPath)

// Create tables if not exist (simple bootstrap; migrations recommended for future changes)
sqlite.exec(`
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  title TEXT,
  model TEXT,
  web_search INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  raw TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(conversation_id) REFERENCES conversations(id)
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at ON messages(conversation_id, created_at);
`)

export const db = drizzle(sqlite, { schema })
export { schema }

