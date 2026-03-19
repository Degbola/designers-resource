import { neon } from '@neondatabase/serverless'

// D1-compatible wrapper for Neon PostgreSQL
// This allows all existing API routes to keep their .prepare().bind().all()/.first()/.run() pattern

const sql = neon(process.env.DATABASE_URL!)

function convertPlaceholders(query: string): string {
  let i = 0
  return query.replace(/\?/g, () => `$${++i}`)
}

class PreparedStatement {
  private query: string
  private params: unknown[] = []

  constructor(query: string) {
    this.query = convertPlaceholders(query)
  }

  bind(...params: unknown[]): PreparedStatement {
    this.params = params
    return this
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    const rows = await sql(this.query, this.params)
    return { results: rows as T[] }
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const rows = await sql(this.query, this.params)
    return (rows[0] as T) || null
  }

  async run(): Promise<{ meta: { last_row_id: number | null; changes: number } }> {
    let query = this.query
    const trimmed = query.trim().toUpperCase()
    const isInsert = trimmed.startsWith('INSERT')
    if (isInsert && !trimmed.includes('RETURNING')) {
      query = query.replace(/;?\s*$/, '') + ' RETURNING id'
    }
    const rows = await sql(query, this.params)
    return {
      meta: {
        last_row_id: isInsert && rows[0] ? (rows[0] as { id: number }).id : null,
        changes: rows.length
      }
    }
  }
}

class NeonDB {
  prepare(query: string): PreparedStatement {
    return new PreparedStatement(query)
  }

  async batch(statements: PreparedStatement[]): Promise<unknown[]> {
    const results = []
    for (const stmt of statements) {
      try {
        results.push(await stmt.run())
      } catch {
        // Ignore errors in batch (e.g. table already exists)
        results.push(null)
      }
    }
    return results
  }
}

let dbInstance: NeonDB | null = null
let schemaInitialized = false

export function getDb(): NeonDB {
  if (!dbInstance) {
    dbInstance = new NeonDB()
  }
  return dbInstance
}

export async function ensureSchema(): Promise<void> {
  if (schemaInitialized) return
  schemaInitialized = true
  await initializeSchema()
}

export async function initializeSchema(): Promise<void> {
  const db = getDb()
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin','member')),
      is_active INTEGER DEFAULT 1,
      permissions TEXT DEFAULT '["clients","projects","invoices","finances","resources","brands","social","tools"]',
      created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
      updated_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
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
      created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
      updated_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
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
      created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
      updated_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
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
      created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS invoice_items (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS income (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      client_id INTEGER,
      invoice_id INTEGER,
      amount REAL NOT NULL,
      category TEXT DEFAULT 'design',
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      category TEXT DEFAULT 'general',
      description TEXT DEFAULT '',
      vendor TEXT DEFAULT '',
      date TEXT NOT NULL,
      receipt_url TEXT DEFAULT '',
      created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS resources (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      url TEXT DEFAULT '',
      category TEXT DEFAULT 'tools' CHECK(category IN ('tools','inspiration','fonts','colors','icons','stock','learning')),
      tags TEXT DEFAULT '',
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS project_files (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT DEFAULT '',
      size INTEGER DEFAULT 0,
      uploaded_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS work_approvals (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','revision')),
      client_feedback TEXT DEFAULT '',
      created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS brand_generations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      brand_name TEXT NOT NULL,
      tagline TEXT DEFAULT '',
      industry TEXT DEFAULT '',
      prompt TEXT DEFAULT '',
      result_json TEXT NOT NULL,
      created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS social_content_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      brand_name TEXT NOT NULL,
      platforms TEXT DEFAULT '',
      content_types TEXT DEFAULT '',
      format_preference TEXT DEFAULT '',
      post_count INTEGER DEFAULT 0,
      posts_json TEXT NOT NULL,
      created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS portal_messages (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      sender TEXT NOT NULL CHECK(sender IN ('designer', 'client')),
      content TEXT NOT NULL,
      read_by_designer INTEGER DEFAULT 0,
      read_by_client INTEGER DEFAULT 0,
      created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )`),
  ])

  // Migrations: add columns to existing tables if not present
  const migrations = [
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE income ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE resources ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE brand_generations ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE social_content_history ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active INTEGER DEFAULT 1`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '["clients","projects","invoices","finances","resources","brands","social","tools"]'`,
  ]
  for (const migration of migrations) {
    try { await sql(migration) } catch { /* already applied */ }
  }
}
