import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendInvoiceEmail } from '@/lib/email'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()

  const invoice = await db.prepare(`SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?`
  ).bind(id).first<{ invoice_number: string; client_email: string; total: number; due_date: string }>()

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (!invoice.client_email) {
    return NextResponse.json({ error: 'Client has no email address' }, { status: 400 })
  }

  try {
    await sendInvoiceEmail(
      invoice.client_email,
      invoice.invoice_number,
      formatCurrency(invoice.total),
      formatDate(invoice.due_date)
    )

    await db.prepare("UPDATE invoices SET status = 'sent' WHERE id = ? AND status = 'draft'").bind(id).run()

    return NextResponse.json({ success: true, message: `Invoice sent to ${invoice.client_email}` })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
