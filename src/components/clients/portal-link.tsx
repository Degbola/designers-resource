'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Send } from 'lucide-react'

export function PortalLink({ token, clientName, clientEmail }: { token: string; clientName: string; clientEmail: string }) {
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const portalUrl = `${window.location.origin}/portal/${token}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendEmail = async () => {
    if (!clientEmail) {
      setError('No email address on file for this client')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/portal/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, clientName, clientEmail }),
      })
      if (res.ok) {
        setSent(true)
        setTimeout(() => setSent(false), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to send email')
      }
    } catch {
      setError('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <span className="text-xs text-dark-400">Portal Link</span>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs text-accent bg-dark-700 px-3 py-2 rounded-lg truncate">{portalUrl}</code>
        <Button size="sm" variant="secondary" onClick={handleCopy}>
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
        </Button>
        {clientEmail && (
          <Button size="sm" variant="secondary" onClick={handleSendEmail} disabled={sending}>
            {sent ? <><Check size={14} /> Sent</> : sending ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={14} /> Email</>}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
