// Client-side PDF generator.
// Renders the chosen invoice template to a hidden DOM node, captures it with
// html2canvas, then writes the result to a single-page A4 PDF via jsPDF.
//
// Why this approach (vs @react-pdf/renderer):
//   - Reuses the same React templates for both preview and download — no fork.
//   - Both deps already installed.
//   - Output stays well under 5MB for typical invoices (logo capped at 600px).

import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { InvoiceTemplate, type InvoiceData, type TemplateId } from '@/components/invoice-templates'
import { loadGoogleFont } from '@/lib/font-loader'

export async function generateInvoicePdf(templateId: TemplateId, data: InvoiceData): Promise<Blob> {
  // Off-screen container
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.top = '-10000px'
  host.style.left = '-10000px'
  host.style.width = '794px'
  host.style.background = '#ffffff'
  document.body.appendChild(host)

  // Pre-load the chosen font + a heavier weight before render so html2canvas captures it
  if (data.font_family) {
    loadGoogleFont(data.font_family, data.font_weight || 400)
    loadGoogleFont(data.font_family, 600)
  }

  const root = createRoot(host)
  try {
    flushSync(() => {
      root.render(<InvoiceTemplate templateId={templateId} data={data} />)
    })

    // Wait for fonts to actually be ready before capturing
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready
    }
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

    const target = host.firstElementChild as HTMLElement | null
    if (!target) throw new Error('Failed to render template')

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    // JPEG at 0.85 quality — keeps PDF under 1MB even with a logo
    const imgData = canvas.toDataURL('image/jpeg', 0.85)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgRatio = canvas.width / canvas.height
    const pageRatio = pageWidth / pageHeight

    // Fit to page width; height scales proportionally
    let renderWidth = pageWidth
    let renderHeight = pageWidth / imgRatio
    if (renderHeight > pageHeight) {
      renderHeight = pageHeight
      renderWidth = pageHeight * imgRatio
    }
    const offsetX = (pageWidth - renderWidth) / 2
    const offsetY = 0

    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST')
    void pageRatio
    return pdf.output('blob')
  } finally {
    root.unmount()
    host.remove()
  }
}

export async function downloadInvoicePdf(templateId: TemplateId, data: InvoiceData) {
  const blob = await generateInvoicePdf(templateId, data)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${data.invoice_number}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
