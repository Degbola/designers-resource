import { NextRequest, NextResponse } from 'next/server'
import { sendPortalLinkEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, clientName, clientEmail } = body

  if (!token || !clientEmail) {
    return NextResponse.json({ error: 'Token and email are required' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const portalUrl = `${appUrl}/portal/${token}`

  try {
    await sendPortalLinkEmail(clientEmail, clientName, portalUrl)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send email. Check email configuration.' }, { status: 500 })
  }
}
