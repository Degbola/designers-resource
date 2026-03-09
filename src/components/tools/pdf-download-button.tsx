'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'

interface PdfDownloadButtonProps {
  invoice: {
    invoice_number: string
    client_name: string
    client_email: string
    company: string
    address: string
    phone: string
    issue_date: string
    due_date: string
    paid_date: string | null
    status: string
    subtotal: number
    tax_rate: number
    tax_amount: number
    total: number
    notes: string
  }
  items: {
    description: string
    quantity: number
    unit_price: number
    amount: number
  }[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function PdfDownloadButton({ invoice, items }: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      const contentWidth = pageWidth - margin * 2
      let y = margin

      // Header
      doc.setFillColor(99, 102, 241)
      doc.rect(0, 0, pageWidth, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.setFont('helvetica', 'bold')
      doc.text('INVOICE', margin, 28)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(invoice.invoice_number, pageWidth - margin, 28, { align: 'right' })

      y = 55

      // Status badge
      const statusColors: Record<string, [number, number, number]> = {
        draft: [113, 113, 122],
        sent: [59, 130, 246],
        paid: [34, 197, 94],
        overdue: [239, 68, 68],
      }
      const statusColor = statusColors[invoice.status] || [113, 113, 122]
      doc.setFillColor(...statusColor)
      const statusText = invoice.status.toUpperCase()
      const statusWidth = doc.getTextWidth(statusText) + 10
      doc.roundedRect(pageWidth - margin - statusWidth, y - 5, statusWidth, 8, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.text(statusText, pageWidth - margin - statusWidth / 2, y, { align: 'center' })

      // Bill To
      doc.setTextColor(120, 120, 140)
      doc.setFontSize(9)
      doc.text('BILL TO', margin, y)
      y += 6
      doc.setTextColor(30, 30, 50)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(invoice.client_name, margin, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      y += 5
      if (invoice.company) { doc.text(invoice.company, margin, y); y += 4 }
      if (invoice.client_email) { doc.text(invoice.client_email, margin, y); y += 4 }
      if (invoice.phone) { doc.text(invoice.phone, margin, y); y += 4 }
      if (invoice.address) { doc.text(invoice.address, margin, y); y += 4 }

      // Dates - right side
      const datesX = pageWidth - margin
      let datesY = 65
      doc.setTextColor(120, 120, 140)
      doc.setFontSize(9)
      doc.text('Issue Date:', datesX - 45, datesY)
      doc.setTextColor(30, 30, 50)
      doc.text(formatDate(invoice.issue_date), datesX, datesY, { align: 'right' })
      datesY += 5
      doc.setTextColor(120, 120, 140)
      doc.text('Due Date:', datesX - 45, datesY)
      doc.setTextColor(30, 30, 50)
      doc.text(formatDate(invoice.due_date), datesX, datesY, { align: 'right' })
      if (invoice.paid_date) {
        datesY += 5
        doc.setTextColor(120, 120, 140)
        doc.text('Paid:', datesX - 45, datesY)
        doc.setTextColor(34, 197, 94)
        doc.text(formatDate(invoice.paid_date), datesX, datesY, { align: 'right' })
      }

      y = Math.max(y, datesY) + 15

      // Table header
      doc.setFillColor(245, 245, 250)
      doc.rect(margin, y - 4, contentWidth, 10, 'F')
      doc.setTextColor(100, 100, 120)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('DESCRIPTION', margin + 3, y + 2)
      doc.text('QTY', margin + contentWidth * 0.55, y + 2, { align: 'center' })
      doc.text('PRICE', margin + contentWidth * 0.72, y + 2, { align: 'right' })
      doc.text('AMOUNT', margin + contentWidth - 3, y + 2, { align: 'right' })
      y += 10

      // Table rows
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      items.forEach((item) => {
        doc.setTextColor(30, 30, 50)
        const descLines = doc.splitTextToSize(item.description, contentWidth * 0.5)
        doc.text(descLines, margin + 3, y + 2)
        doc.setTextColor(80, 80, 100)
        doc.text(String(item.quantity), margin + contentWidth * 0.55, y + 2, { align: 'center' })
        doc.text(formatCurrency(item.unit_price), margin + contentWidth * 0.72, y + 2, { align: 'right' })
        doc.setTextColor(30, 30, 50)
        doc.text(formatCurrency(item.amount), margin + contentWidth - 3, y + 2, { align: 'right' })
        const rowHeight = Math.max(descLines.length * 4.5, 8)
        y += rowHeight
        doc.setDrawColor(230, 230, 240)
        doc.line(margin, y, margin + contentWidth, y)
        y += 3
      })

      y += 8

      // Totals
      const totalsX = margin + contentWidth * 0.6
      const totalsWidth = contentWidth * 0.4
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 120)
      doc.text('Subtotal', totalsX, y)
      doc.setTextColor(30, 30, 50)
      doc.text(formatCurrency(invoice.subtotal), margin + contentWidth - 3, y, { align: 'right' })
      y += 6
      doc.setTextColor(100, 100, 120)
      doc.text(`Tax (${invoice.tax_rate}%)`, totalsX, y)
      doc.setTextColor(30, 30, 50)
      doc.text(formatCurrency(invoice.tax_amount), margin + contentWidth - 3, y, { align: 'right' })
      y += 4
      doc.setDrawColor(99, 102, 241)
      doc.setLineWidth(0.5)
      doc.line(totalsX, y, margin + contentWidth, y)
      y += 6
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(99, 102, 241)
      doc.text('Total', totalsX, y)
      doc.text(formatCurrency(invoice.total), margin + contentWidth - 3, y, { align: 'right' })

      // Notes
      if (invoice.notes) {
        y += 15
        doc.setDrawColor(230, 230, 240)
        doc.line(margin, y, margin + contentWidth, y)
        y += 8
        doc.setTextColor(120, 120, 140)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('NOTES', margin, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(80, 80, 100)
        const noteLines = doc.splitTextToSize(invoice.notes, contentWidth)
        doc.text(noteLines, margin, y)
      }

      doc.save(`${invoice.invoice_number}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="secondary" onClick={handleDownload} disabled={loading}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      Download PDF
    </Button>
  )
}
