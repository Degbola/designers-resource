import { createClient, type Client } from '@libsql/client'
import { v4 as uuidv4 } from 'uuid'

// D1-compatible wrapper for Turso/libsql
// All API routes keep their .prepare().bind().all()/.first()/.run() pattern

let clientInstance: Client | null = null

function getClient(): Client {
  if (!clientInstance) {
    clientInstance = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })
  }
  return clientInstance
}

class PreparedStatement {
  private query: string
  private params: unknown[] = []

  constructor(query: string) {
    this.query = query
  }

  bind(...params: unknown[]): PreparedStatement {
    this.params = params
    return this
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    const result = await getClient().execute({ sql: this.query, args: this.params as any[] })
    const cols = result.columns
    const rows = result.rows.map(row => Object.fromEntries(cols.map((col, i) => [col, row[i]])))
    return { results: rows as unknown as T[] }
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const result = await getClient().execute({ sql: this.query, args: this.params as any[] })
    if (!result.rows[0]) return null
    const row = Object.fromEntries(result.columns.map((col, i) => [col, result.rows[0][i]]))
    return row as unknown as T
  }

  async run(): Promise<{ meta: { last_row_id: number | null; changes: number } }> {
    const result = await getClient().execute({ sql: this.query, args: this.params as any[] })
    return {
      meta: {
        last_row_id: result.lastInsertRowid ? Number(result.lastInsertRowid) : null,
        changes: result.rowsAffected,
      }
    }
  }
}

class TursoDB {
  prepare(query: string): PreparedStatement {
    return new PreparedStatement(query)
  }

  async batch(statements: PreparedStatement[]): Promise<unknown[]> {
    const results = []
    for (const stmt of statements) {
      try {
        results.push(await stmt.run())
      } catch {
        results.push(null)
      }
    }
    return results
  }
}

let dbInstance: TursoDB | null = null
let schemaPromise: Promise<void> | null = null

export function getDb(): TursoDB {
  if (!dbInstance) dbInstance = new TursoDB()
  return dbInstance
}

export async function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = initializeSchema().catch((err) => {
      schemaPromise = null // allow retry on failure
      throw err
    })
  }
  return schemaPromise
}

export async function initializeSchema(): Promise<void> {
  const db = getDb()
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin','member')),
      is_active INTEGER DEFAULT 1,
      permissions TEXT DEFAULT '["clients","projects","invoices","finances","resources","brands","social","tools"]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      phone TEXT DEFAULT '',
      company TEXT DEFAULT '',
      address TEXT DEFAULT '',
      status TEXT DEFAULT 'lead' CHECK(status IN ('lead','active','completed','archived')),
      onboarding_step INTEGER DEFAULT 0,
      portal_token TEXT UNIQUE,
      notes TEXT DEFAULT '',
      avatar_color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'not_started' CHECK(status IN ('not_started','in_progress','review','completed')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
      start_date TEXT DEFAULT '',
      due_date TEXT DEFAULT '',
      budget REAL DEFAULT 0,
      progress INTEGER DEFAULT 0,
      drive_folder_url TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      invoice_number TEXT NOT NULL UNIQUE,
      client_id INTEGER NOT NULL,
      project_id INTEGER,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','sent','paid','overdue')),
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      paid_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      client_id INTEGER,
      invoice_id INTEGER,
      amount REAL NOT NULL,
      category TEXT DEFAULT 'design',
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      category TEXT DEFAULT 'general',
      description TEXT DEFAULT '',
      vendor TEXT DEFAULT '',
      date TEXT NOT NULL,
      receipt_url TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      url TEXT DEFAULT '',
      category TEXT DEFAULT 'tools' CHECK(category IN ('tools','inspiration','fonts','colors','icons','stock','learning')),
      tags TEXT DEFAULT '',
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS project_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT DEFAULT '',
      size INTEGER DEFAULT 0,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS work_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','revision')),
      client_feedback TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS brand_generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      brand_name TEXT NOT NULL,
      tagline TEXT DEFAULT '',
      industry TEXT DEFAULT '',
      prompt TEXT DEFAULT '',
      result_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS social_content_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      brand_name TEXT NOT NULL,
      platforms TEXT DEFAULT '',
      content_types TEXT DEFAULT '',
      format_preference TEXT DEFAULT '',
      post_count INTEGER DEFAULT 0,
      posts_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS portal_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      sender TEXT NOT NULL CHECK(sender IN ('designer', 'client')),
      content TEXT NOT NULL,
      read_by_designer INTEGER DEFAULT 0,
      read_by_client INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )`),
  ])

  // Migrations: add columns to existing tables (SQLite ignores errors if column exists)
  const migrations = [
    `ALTER TABLE clients ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE projects ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE invoices ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE income ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE expenses ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE resources ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE brand_generations ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE social_content_history ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1`,
    `ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '["clients","projects","invoices","finances","resources","brands","social","tools"]'`,
    `ALTER TABLE invoices ADD COLUMN sender_email TEXT DEFAULT ''`,
    `ALTER TABLE invoices ADD COLUMN currency TEXT DEFAULT 'USD'`,
  ]
  for (const migration of migrations) {
    try { await getClient().execute(migration) } catch { /* column already exists */ }
  }

  // Backfill portal_token for any clients that are missing one
  const missing = await getClient().execute(`SELECT id FROM clients WHERE portal_token IS NULL`)
  for (const row of missing.rows) {
    const token = uuidv4().replace(/-/g, '')
    try {
      await getClient().execute({ sql: `UPDATE clients SET portal_token = ? WHERE id = ?`, args: [token, row[0]] })
    } catch { /* ignore constraint violations */ }
  }
}
