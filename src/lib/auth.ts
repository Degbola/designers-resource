import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { getDb, initDb } from '@/lib/db'
import { generateToken } from '@/lib/utils'
import type { SafeUser, Session } from '@/types'

const SESSION_DURATION_DAYS = 30
export const COOKIE_NAME = 'session_token'

// --- Password hashing ---

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const hashBuffer = Buffer.from(hash, 'hex')
  const derivedBuffer = scryptSync(password, salt, 64)
  return timingSafeEqual(hashBuffer, derivedBuffer)
}

// --- Session management ---

export async function createSession(userId: number): Promise<string> {
  await initDb()
  const db = getDb()
  const token = generateToken()
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  await db.execute({
    sql: 'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    args: [userId, token, expiresAt],
  })

  return token
}

export async function getSession(): Promise<SafeUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  return getSessionByToken(token)
}

export async function getSessionByToken(token: string): Promise<SafeUser | null> {
  await initDb()
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM sessions WHERE token = ?',
    args: [token],
  })
  const session = result.rows[0] as unknown as Session | undefined

  if (!session) return null

  if (new Date(session.expires_at) < new Date()) {
    await db.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [session.id] })
    return null
  }

  const userResult = await db.execute({
    sql: 'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?',
    args: [session.user_id],
  })
  const row = userResult.rows[0]
  if (!row) return null

  return JSON.parse(JSON.stringify(row)) as SafeUser
}

export async function deleteSession(token: string): Promise<void> {
  await initDb()
  const db = getDb()
  await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] })
}

export async function cleanExpiredSessions(): Promise<void> {
  await initDb()
  const db = getDb()
  await db.execute("DELETE FROM sessions WHERE expires_at < datetime('now')")
}

// --- Cookie helpers ---

export function getSessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  }
}

export function getDeleteCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }
}
