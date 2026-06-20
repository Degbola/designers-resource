import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendInvoiceEmail } from '@/lib/email'
import { formatCurrencyWith, formatDate } from '@/lib/utils'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = getDb()

  const invoice = await db.prepare(`SELECT i.*, c.name as client_name, c.email as client_email, c.portal_token
    FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ? AND i.user_id = ?`
  ).bind(id, user.id).first<{ invoice_number: string; client_name: string; client_email: string; total: number; due_date: string; sender_email: string; currency: string; portal_token: string }>()

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if (!invoice.client_email) return NextResponse.json({ error: 'Client has no email address' }, { status: 400 })

  // Accept either multipart (with PDF attachment) or JSON
  let pdfBuffer: Buffer | undefined
  const contentType = req.headers.get('content-type') || ''
  if (contentType.startsWith('multipart/form-data')) {
    const form = await req.formData()
    const file = form.get('pdf')
    if (file && file instanceof File) {
      pdfBuffer = Buffer.from(await file.arrayBuffer())
    }
  }

  const origin = req.headers.get('origin') || new URL(req.url).origin
  const portalUrl = invoice.portal_token ? `${origin}/portal/${invoice.portal_token}/invoices/${id}` : undefined

  try {
    await sendInvoiceEmail(
      invoice.client_email,
      invoice.invoice_number,
      formatCurrencyWith(invoice.total, invoice.currency || 'USD'),
      formatDate(invoice.due_date),
      pdfBuffer,
      invoice.sender_email || undefined,
      portalUrl,
      invoice.client_name || ''
    )

    await db.prepare("UPDATE invoices SET status = 'sent' WHERE id = ? AND status = 'draft' AND user_id = ?").bind(id, user.id).run()

    return NextResponse.json({
      success: true,
      message: `Invoice sent to ${invoice.client_email}${pdfBuffer ? ' with PDF attached' : ''}`,
      portalUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    return NextResponse.json({ error: message, portalUrl }, { status: 500 })
  }
}
