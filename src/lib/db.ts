import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { D1Database } from '@cloudflare/workers-types'

export function getDb(): D1Database {
  const { env } = getCloudflareContext() as unknown as { env: { DB: D1Database } }
  return env.DB
}

export async function initializeSchema(): Promise<void> {
  const db = getDb()
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin' CHECK(role IN ('admin','member')),
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
    db.prepare(`CREATE TABLE IF NOT EXISTS brand_generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_name TEXT NOT NULL,
      tagline TEXT DEFAULT '',
      industry TEXT DEFAULT '',
      prompt TEXT DEFAULT '',
      result_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS social_content_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
}
