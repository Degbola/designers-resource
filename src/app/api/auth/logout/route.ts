import { NextRequest, NextResponse } from 'next/server'
import { deleteSession, getDeleteCookieOptions, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value

  if (token) {
    await deleteSession(token)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(getDeleteCookieOptions())
  return response
}
