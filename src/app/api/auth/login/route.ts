import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
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

  await initDb()
  const db = getDb()

  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [(body.email as string).toLowerCase().trim()],
  })
  const user = result.rows[0] as unknown as User | undefined

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  }

  if (!verifyPassword(body.password, user.password_hash)) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
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
