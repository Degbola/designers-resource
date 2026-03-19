import { NextRequest, NextResponse } from 'next/server'
import { getDb, ensureSchema } from '@/lib/db'
import { hashPassword, createSession, getSessionCookieOptions } from '@/lib/auth'
import { validate, validationError } from '@/lib/validate'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, retryAfterSeconds } = checkRateLimit(`signup:${ip}`)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${retryAfterSeconds} seconds.` },
      { status: 429 }
    )
  }

  await ensureSchema()
  const db = getDb()

  const body = await req.json()

  const error = validate(body, [
    { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 100 },
    { field: 'email', required: true, type: 'email' },
    { field: 'password', required: true, type: 'string', minLength: 8, maxLength: 128 },
  ])
  if (error) return validationError(error)

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?')
    .bind((body.email as string).toLowerCase().trim())
    .first<{ id: number }>()

  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 }
    )
  }

  const password_hash = await hashPassword(body.password)
  const result = await db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)')
    .bind((body.email as string).toLowerCase().trim(), password_hash, (body.name as string).trim(), 'admin')
    .run()

  const newId = Number(result.meta.last_row_id)
  const token = await createSession(newId)

  const response = NextResponse.json(
    { id: newId, email: (body.email as string).toLowerCase().trim(), name: (body.name as string).trim(), role: 'admin' },
    { status: 201 }
  )

  response.cookies.set(getSessionCookieOptions(token))
  return response
}
