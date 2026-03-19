import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { generateInvoiceNumber } from '@/lib/utils'
import { validate, validationError } from '@/lib/validate'
import { hasPermission } from '@/lib/permissions'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'invoices')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const result = await db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.user_id = ?
    ORDER BY i.created_at DESC
  `).bind(user.id).all()
  return NextResponse.json(result.results)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'invoices')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const body = await req.json()

  const error = validate(body, [
    { field: 'issue_date', required: true, type: 'string' },
    { field: 'due_date', required: true, type: 'string' },
  ])
  if (error) return validationError(error)

  // Resolve client — accept client_id or client_name (find-or-create)
  let clientId: number = body.client_id
  if (!clientId && body.client_name) {
    const name = (body.client_name as string).trim()
    const existing = await db.prepare('SELECT id FROM clients WHERE LOWER(name) = LOWER(?) AND user_id = ?')
      .bind(name, user.id).first<{ id: number }>()
    if (existing) {
      clientId = existing.id
    } else {
      const r = await db.prepare('INSERT INTO clients (user_id, name, email) VALUES (?, ?, ?)').bind(user.id, name, '').run()
      clientId = Number(r.meta.last_row_id)
    }
  }
  if (!clientId) return NextResponse.json({ error: 'Client is required' }, { status: 400 })

  // Resolve project — optional, find-or-create by name
  let projectId: number | null = body.project_id || null
  if (!projectId && body.project_name) {
    const pname = (body.project_name as string).trim()
    const existing = await db.prepare('SELECT id FROM projects WHERE LOWER(name) = LOWER(?) AND user_id = ?')
      .bind(pname, user.id).first<{ id: number }>()
    if (existing) {
      projectId = existing.id
    } else {
      const r = await db.prepare('INSERT INTO projects (user_id, client_id, name, status) VALUES (?, ?, ?, ?)')
        .bind(user.id, clientId, pname, 'not_started').run()
      projectId = Number(r.meta.last_row_id)
    }
  }

  const invoiceNumber = body.invoice_number || generateInvoiceNumber()
  const items = body.items || []
  const subtotal = items.reduce((sum: number, item: { quantity: number; unit_price: number }) => sum + item.quantity * item.unit_price, 0)
  const taxRate = body.tax_rate || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const result = await db.prepare(
    `INSERT INTO invoices (user_id, invoice_number, client_id, project_id, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id, invoiceNumber, clientId, projectId,
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
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'invoices')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const body = await req.json()

  const items = body.items || []
  const subtotal = items.reduce((sum: number, item: { quantity: number; unit_price: number }) => sum + item.quantity * item.unit_price, 0)
  const taxRate = body.tax_rate || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  await db.prepare(
    `UPDATE invoices SET client_id=?, project_id=?, status=?, issue_date=?, due_date=?, subtotal=?, tax_rate=?, tax_amount=?, total=?, notes=?, paid_date=?
    WHERE id=? AND user_id=?`
  ).bind(
    body.client_id, body.project_id || null, body.status, body.issue_date, body.due_date,
    subtotal, taxRate, taxAmount, total, body.notes || '', body.paid_date || null, body.id, user.id,
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
        'INSERT INTO income (user_id, client_id, invoice_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(user.id, body.client_id, body.id, total, 'invoice', `Payment for ${body.invoice_number || 'invoice'}`, body.paid_date).run()
    }
  }

  const invoice = await db.prepare(
    'SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?'
  ).bind(body.id).first()
  return NextResponse.json(invoice)
}

export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'invoices')) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?').bind(id, user.id).run()
  return NextResponse.json({ success: true })
}
