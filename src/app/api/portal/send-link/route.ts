import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')
  const body = await req.json()
  const { token, clientName, clientEmail } = body

  if (!token || !clientEmail) {
    return NextResponse.json({ error: 'Token and email are required' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const portalUrl = `${appUrl}/portal/${token}`
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: clientEmail,
      subject: 'Your Client Portal Access - Seysey Studios',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Welcome to Your Client Portal</h2>
          <p>Hi ${clientName || 'there'},</p>
          <p>You can access your client portal to view your projects, invoices, and approve work items using the link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${portalUrl}" style="background-color: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open Your Portal</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Or copy this link: <a href="${portalUrl}" style="color: #6366f1;">${portalUrl}</a></p>
          <p style="color: #6b7280; font-size: 13px;">Please keep this link private — it provides direct access to your project information.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Sent via Seysey Studios</p>
        </div>
      `,
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to send email. Check email configuration.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send email. Check email configuration.' }, { status: 500 })
  }
}
