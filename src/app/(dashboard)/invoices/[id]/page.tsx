import { getDb, initDb } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PdfDownloadButton } from '@/components/tools/pdf-download-button'
import type { Invoice, InvoiceItem, Client } from '@/types'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await initDb()
  const db = getDb()

  const invoiceResult = await db.execute({
    sql: `SELECT i.*, c.name as client_name, c.email as client_email, c.company, c.address, c.phone
    FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?`,
    args: [id],
  })
  const invoice = invoiceResult.rows[0] as unknown as (Invoice & { company: string; address: string; phone: string }) | undefined

  if (!invoice) notFound()

  const itemsResult = await db.execute({ sql: 'SELECT * FROM invoice_items WHERE invoice_id = ?', args: [id] })
  const items = itemsResult.rows as unknown as InvoiceItem[]

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-dark-100 transition-colors">
          <ArrowLeft size={16} /> Back to Invoices
        </Link>
        <PdfDownloadButton invoice={{
          invoice_number: invoice.invoice_number,
          client_name: invoice.client_name || '',
          client_email: invoice.client_email || '',
          company: invoice.company || '',
          address: invoice.address || '',
          phone: invoice.phone || '',
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          paid_date: invoice.paid_date,
          status: invoice.status,
          subtotal: invoice.subtotal,
          tax_rate: invoice.tax_rate,
          tax_amount: invoice.tax_amount,
          total: invoice.total,
          notes: invoice.notes || '',
        }} items={items.map(i => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price, amount: i.amount }))} />
      </div>

      <Card className="!p-4 sm:!p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-dark-100 mb-1">INVOICE</h2>
            <p className="text-accent font-mono text-lg">{invoice.invoice_number}</p>
          </div>
          <Badge variant={invoice.status} className="text-sm px-3 py-1">{invoice.status}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-dark-400 mb-2">Bill To</h4>
            <p className="font-semibold text-dark-100">{invoice.client_name}</p>
            {invoice.company && <p className="text-sm text-dark-300">{invoice.company}</p>}
            {invoice.client_email && <p className="text-sm text-dark-300">{invoice.client_email}</p>}
            {invoice.phone && <p className="text-sm text-dark-300">{invoice.phone}</p>}
            {invoice.address && <p className="text-sm text-dark-300">{invoice.address}</p>}
          </div>
          <div className="sm:text-right">
            <div className="space-y-1 text-sm">
              <p className="text-dark-400">Issue Date: <span className="text-dark-200">{formatDate(invoice.issue_date)}</span></p>
              <p className="text-dark-400">Due Date: <span className="text-dark-200">{formatDate(invoice.due_date)}</span></p>
              {invoice.paid_date && <p className="text-dark-400">Paid: <span className="text-green-400">{formatDate(invoice.paid_date)}</span></p>}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:-mx-8 px-4 sm:px-8">
        <table className="w-full mb-8 min-w-[400px]">
          <thead>
            <tr className="border-b border-black/[0.07] dark:border-white/[0.08]">
              <th className="text-left py-3 text-xs uppercase tracking-wider text-dark-400">Description</th>
              <th className="text-right py-3 text-xs uppercase tracking-wider text-dark-400">Qty</th>
              <th className="text-right py-3 text-xs uppercase tracking-wider text-dark-400">Price</th>
              <th className="text-right py-3 text-xs uppercase tracking-wider text-dark-400">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-black/[0.07] dark:border-white/[0.08]">
                <td className="py-3 text-dark-100">{item.description}</td>
                <td className="py-3 text-dark-200 text-right">{item.quantity}</td>
                <td className="py-3 text-dark-200 text-right">{formatCurrency(item.unit_price)}</td>
                <td className="py-3 text-dark-100 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-dark-400">No line items</td></tr>
            )}
          </tbody>
        </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm text-dark-300"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
            <div className="flex justify-between text-sm text-dark-300"><span>Tax ({invoice.tax_rate}%)</span><span>{formatCurrency(invoice.tax_amount)}</span></div>
            <div className="flex justify-between font-bold text-xl text-dark-100 border-t border-black/[0.07] dark:border-white/[0.08] pt-3"><span>Total</span><span>{formatCurrency(invoice.total)}</span></div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 pt-6 border-t border-black/[0.07] dark:border-white/[0.08]">
            <h4 className="text-xs uppercase tracking-wider text-dark-400 mb-2">Notes</h4>
            <p className="text-sm text-dark-300">{invoice.notes}</p>
          </div>
        )}
      </Card>
    </div>
  )
}
