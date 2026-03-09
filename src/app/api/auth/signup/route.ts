import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { hashPassword, createSession, getSessionCookieOptions } from '@/lib/auth'
import { validate, validationError } from '@/lib/validate'
import { checkRateLimit } from '@/lib/rate-limit'
import type { User } from '@/types'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, retryAfterSeconds } = checkRateLimit(`signup:${ip}`)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${retryAfterSeconds} seconds.` },
      { status: 429 }
    )
  }

  await initDb()
  const db = getDb()

  const body = await req.json()

  const error = validate(body, [
    { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 100 },
    { field: 'email', required: true, type: 'email' },
    { field: 'password', required: true, type: 'string', minLength: 8, maxLength: 128 },
  ])
  if (error) return validationError(error)

  const existingResult = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [(body.email as string).toLowerCase().trim()],
  })
  const existing = existingResult.rows[0] as unknown as User | undefined

  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 }
    )
  }

  const password_hash = hashPassword(body.password)
  const result = await db.execute({
    sql: 'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
    args: [(body.email as string).toLowerCase().trim(), password_hash, (body.name as string).trim(), 'admin'],
  })

  const token = await createSession(Number(result.lastInsertRowid))

  const response = NextResponse.json(
    { id: Number(result.lastInsertRowid), email: (body.email as string).toLowerCase().trim(), name: (body.name as string).trim(), role: 'admin' },
    { status: 201 }
  )

  response.cookies.set(getSessionCookieOptions(token))
  return response
}
