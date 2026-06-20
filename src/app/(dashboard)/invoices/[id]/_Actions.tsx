'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Download, ChevronDown, Loader2, Send, Link2, Check } from 'lucide-react'
import { TEMPLATE_LIST } from '@/components/invoice-templates'
import type { InvoiceData, TemplateId } from '@/components/invoice-templates'

export function InvoiceDetailActions({
  invoiceId,
  templateId,
  data,
  currentTemplate,
  portalToken,
  clientEmail,
  status,
}: {
  invoiceId: number
  templateId: TemplateId
  data: InvoiceData
  currentTemplate: TemplateId
  portalToken: string
  clientEmail: string
  status: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sending, setSending] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const switchTemplate = async (newId: TemplateId) => {
    if (newId === currentTemplate) { setOpen(false); return }
    setSwitching(true)
    try {
      await fetch(`/api/invoices/${invoiceId}/template`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: newId }),
      })
      router.refresh()
    } finally {
      setSwitching(false)
      setOpen(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { downloadInvoicePdf } = await import('@/lib/pdf-generator')
      await downloadInvoicePdf(templateId, data)
    } finally {
      setDownloading(false)
    }
  }

  const handleSend = async () => {
    if (!clientEmail) {
      setFeedback({ kind: 'error', text: 'Client has no email address on file' })
      return
    }
    setSending(true)
    setFeedback(null)
    try {
      const { generateInvoicePdf } = await import('@/lib/pdf-generator')
      const blob = await generateInvoicePdf(templateId, data)

      const form = new FormData()
      form.append('pdf', blob, `${data.invoice_number}.pdf`)

      const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: 'POST', body: form })
      const json = await res.json()
      if (res.ok) {
        setFeedback({ kind: 'success', text: json.message || 'Sent' })
        router.refresh()
      } else {
        setFeedback({ kind: 'error', text: json.error || 'Failed to send' })
      }
    } catch (e) {
      setFeedback({ kind: 'error', text: e instanceof Error ? e.message : 'Failed' })
    } finally {
      setSending(false)
    }
  }

  const copyShareLink = async () => {
    if (!portalToken) return
    const url = `${window.location.origin}/portal/${portalToken}/invoices/${invoiceId}`
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // fallback
      window.prompt('Copy this link:', url)
    }
  }

  return (
    <div className="flex items-center gap-2 relative flex-wrap justify-end">
      {feedback && (
        <span className={`text-[11px] ${feedback.kind === 'success' ? 'text-accent' : 'text-red-500'}`}>
          {feedback.text}
        </span>
      )}

      <div className="relative">
        <Button variant="secondary" onClick={() => setOpen(!open)} disabled={switching} size="sm">
          {switching ? <Loader2 size={12} className="animate-spin" /> : null}
          {TEMPLATE_LIST.find(t => t.id === currentTemplate)?.label || 'Classic'}
          <ChevronDown size={12} />
        </Button>
        {open && (
          <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded border border-dark-600 dark:border-[rgba(255,255,255,0.10)] bg-[#FDFCFA] dark:bg-[#0a0f0b] shadow-lg overflow-hidden">
            {TEMPLATE_LIST.map(t => (
              <button
                key={t.id}
                onClick={() => switchTemplate(t.id)}
                className={`w-full text-left px-3 py-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors ${currentTemplate === t.id ? 'bg-accent/5' : ''}`}
              >
                <p className="text-[12px] font-medium text-dark-100">{t.label}</p>
                <p className="text-[10px] text-dark-400 leading-tight">{t.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {portalToken && (
        <Button variant="secondary" size="sm" onClick={copyShareLink}>
          {linkCopied ? <Check size={12} /> : <Link2 size={12} />}
          {linkCopied ? 'Copied' : 'Share Link'}
        </Button>
      )}

      <Button variant="secondary" size="sm" onClick={handleDownload} disabled={downloading}>
        {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
        PDF
      </Button>

      {status !== 'paid' && (
        <Button size="sm" onClick={handleSend} disabled={sending || !clientEmail}>
          {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          Send
        </Button>
      )}
    </div>
  )
}
