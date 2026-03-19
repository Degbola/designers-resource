import { NextRequest, NextResponse } from 'next/server'
import { getDb, ensureSchema } from '@/lib/db'
import { verifyPassword, createSession, getSessionCookieOptions, cleanExpiredSessions } from '@/lib/auth'
import { validate, validationError } from '@/lib/validate'
import { checkRateLimit } from '@/lib/rate-limit'
import type { User } from '@/types'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, retryAfterSeconds } = checkRateLimit(`login:${ip}`)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${retryAfterSeconds} seconds.` },
      { status: 429 }
    )
  }

  const body = await req.json()

  const error = validate(body, [
    { field: 'email', required: true, type: 'email' },
    { field: 'password', required: true, type: 'string', minLength: 1 },
  ])
  if (error) return validationError(error)

  await ensureSchema()
  const db = getDb()

  const user = await db.prepare('SELECT * FROM users WHERE email = ?')
    .bind((body.email as string).toLowerCase().trim())
    .first<User>()

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  }

  if (!await verifyPassword(body.password, user.password_hash)) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  }

  if (!user.is_active) {
    return NextResponse.json(
      { error: 'Your account has been deactivated. Contact the admin.' },
      { status: 403 }
    )
  }

  await cleanExpiredSessions()

  const token = await createSession(user.id)

  const response = NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })

  response.cookies.set(getSessionCookieOptions(token))
  return response
}
