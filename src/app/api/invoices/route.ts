import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { generateInvoiceNumber } from '@/lib/utils'
import { validate, validationError } from '@/lib/validate'

export async function GET() {
  await initDb()
  const db = getDb()
  const result = await db.execute(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY i.created_at DESC
  `)
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  await initDb()
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

  const result = await db.execute({
    sql: `INSERT INTO invoices (invoice_number, client_id, project_id, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      invoiceNumber, body.client_id, body.project_id || null,
      body.status || 'draft', body.issue_date, body.due_date,
      subtotal, taxRate, taxAmount, total, body.notes || '',
    ],
  })

  const invoiceId = Number(result.lastInsertRowid)

  for (const item of items) {
    await db.execute({
      sql: 'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)',
      args: [invoiceId, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price],
    })
  }

  const invoiceResult = await db.execute({
    sql: 'SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?',
    args: [invoiceId],
  })
  return NextResponse.json(invoiceResult.rows[0], { status: 201 })
}

export async function PUT(req: NextRequest) {
  await initDb()
  const db = getDb()
  const body = await req.json()

  const items = body.items || []
  const subtotal = items.reduce((sum: number, item: { quantity: number; unit_price: number }) => sum + item.quantity * item.unit_price, 0)
  const taxRate = body.tax_rate || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  await db.execute({
    sql: `UPDATE invoices SET client_id=?, project_id=?, status=?, issue_date=?, due_date=?, subtotal=?, tax_rate=?, tax_amount=?, total=?, notes=?, paid_date=?
    WHERE id=?`,
    args: [
      body.client_id, body.project_id || null, body.status, body.issue_date, body.due_date,
      subtotal, taxRate, taxAmount, total, body.notes || '', body.paid_date || null, body.id,
    ],
  })

  await db.execute({ sql: 'DELETE FROM invoice_items WHERE invoice_id = ?', args: [body.id] })
  for (const item of items) {
    await db.execute({
      sql: 'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)',
      args: [body.id, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price],
    })
  }

  // Auto-record income when marked as paid
  if (body.status === 'paid' && body.paid_date) {
    const existingResult = await db.execute({ sql: 'SELECT id FROM income WHERE invoice_id = ?', args: [body.id] })
    if (!existingResult.rows[0]) {
      await db.execute({
        sql: 'INSERT INTO income (client_id, invoice_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)',
        args: [body.client_id, body.id, total, 'invoice', `Payment for ${body.invoice_number || 'invoice'}`, body.paid_date],
      })
    }
  }

  const invoiceResult = await db.execute({
    sql: 'SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?',
    args: [body.id],
  })
  return NextResponse.json(invoiceResult.rows[0])
}

export async function DELETE(req: NextRequest) {
  await initDb()
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.execute({ sql: 'DELETE FROM invoices WHERE id = ?', args: [id] })
  return NextResponse.json({ success: true })
}
