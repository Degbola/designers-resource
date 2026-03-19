import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { generateInvoiceNumber } from '@/lib/utils'
import { validate, validationError } from '@/lib/validate'

export async function GET() {
  const db = getDb()
  const result = await db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY i.created_at DESC
  `).all()
  return NextResponse.json(result.results)
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const body = await req.json()

  const error = validate(body, [
    { field: 'client_id', required: true, type: 'number' },
    { field: 'issue_date', required: true, type: 'string' },
    { field: 'due_date', required: true, type: 'string' },
  ])
  if (error) return validationError(error)

  const invoiceNumber = body.invoice_number || generateInvoiceNumber()
  const items = body.items || []
  const subtotal = items.reduce((sum: number, item: { quantity: number; unit_price: number }) => sum + item.quantity * item.unit_price, 0)
  const taxRate = body.tax_rate || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const result = await db.prepare(
    `INSERT INTO invoices (invoice_number, client_id, project_id, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    invoiceNumber, body.client_id, body.project_id || null,
    body.status || 'draft', body.issue_date, body.due_date,
    subtotal, taxRate, taxAmount, total, body.notes || '',
  ).run()

  const invoiceId = Number(result.meta.last_row_id)

  for (const item of items) {
    await db.prepare(
      'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)'
    ).bind(invoiceId, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price).run()
  }

  const invoice = await db.prepare(
    'SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?'
  ).bind(invoiceId).first()
  return NextResponse.json(invoice, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const db = getDb()
  const body = await req.json()

  const items = body.items || []
  const subtotal = items.reduce((sum: number, item: { quantity: number; unit_price: number }) => sum + item.quantity * item.unit_price, 0)
  const taxRate = body.tax_rate || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  await db.prepare(
    `UPDATE invoices SET client_id=?, project_id=?, status=?, issue_date=?, due_date=?, subtotal=?, tax_rate=?, tax_amount=?, total=?, notes=?, paid_date=?
    WHERE id=?`
  ).bind(
    body.client_id, body.project_id || null, body.status, body.issue_date, body.due_date,
    subtotal, taxRate, taxAmount, total, body.notes || '', body.paid_date || null, body.id,
  ).run()

  await db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').bind(body.id).run()
  for (const item of items) {
    await db.prepare(
      'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)'
    ).bind(body.id, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price).run()
  }

  // Auto-record income when marked as paid
  if (body.status === 'paid' && body.paid_date) {
    const existing = await db.prepare('SELECT id FROM income WHERE invoice_id = ?').bind(body.id).first()
    if (!existing) {
      await db.prepare(
        'INSERT INTO income (client_id, invoice_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(body.client_id, body.id, total, 'invoice', `Payment for ${body.invoice_number || 'invoice'}`, body.paid_date).run()
    }
  }

  const invoice = await db.prepare(
    'SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?'
  ).bind(body.id).first()
  return NextResponse.json(invoice)
}

export async function DELETE(req: NextRequest) {
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.prepare('DELETE FROM invoices WHERE id = ?').bind(id).run()
  return NextResponse.json({ success: true })
}
