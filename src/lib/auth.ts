import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { generateToken } from '@/lib/utils'
import type { SafeUser, Session } from '@/types'

const SESSION_DURATION_DAYS = 30
export const COOKIE_NAME = 'session_token'

// --- Password hashing (Web Crypto API — edge-compatible) ---

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )

  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return `pbkdf2:${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith('pbkdf2:')) return false

  const [, saltHex, hashHex] = stored.split(':')
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )

  const derivedHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Timing-safe comparison
  if (derivedHex.length !== hashHex.length) return false
  let diff = 0
  for (let i = 0; i < derivedHex.length; i++) {
    diff |= derivedHex.charCodeAt(i) ^ hashHex.charCodeAt(i)
  }
  return diff === 0
}

// --- Session management ---

export async function createSession(userId: number): Promise<string> {
  const db = getDb()
  const token = generateToken()
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  await db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)')
    .bind(userId, token, expiresAt)
    .run()

  return token
}

export async function getSession(): Promise<SafeUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  return getSessionByToken(token)
}

export async function getSessionByToken(token: string): Promise<SafeUser | null> {
  const db = getDb()
  const session = await db.prepare('SELECT * FROM sessions WHERE token = ?')
    .bind(token)
    .first<Session>()

  if (!session) return null

  if (new Date(session.expires_at) < new Date()) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(session.id).run()
    return null
  }

  const user = await db.prepare('SELECT id, email, name, role, is_active, permissions, created_at, updated_at FROM users WHERE id = ?')
    .bind(session.user_id)
    .first<SafeUser>()

  if (!user) return null

  return user
}

export async function deleteSession(token: string): Promise<void> {
  const db = getDb()
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
}

export async function cleanExpiredSessions(): Promise<void> {
  const db = getDb()
  await db.prepare("DELETE FROM sessions WHERE expires_at::TIMESTAMP < NOW()").run()
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
