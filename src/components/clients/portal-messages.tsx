'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Message {
  id: number
  sender: 'designer' | 'client'
  content: string
  created_at: string
}

export function PortalMessages({ clientId }: { clientId: number }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/portal-messages?client_id=${clientId}`)
    if (res.ok) setMessages(await res.json())
  }, [clientId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    setSending(true)
    await fetch('/api/admin/portal-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, content: newMessage.trim() }),
    })
    setNewMessage('')
    setSending(false)
    load()
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/30 dark:border-white/8">
      <div className="px-4 py-3 bg-white/30 dark:bg-white/5 border-b border-white/30 dark:border-white/8 flex items-center gap-2">
        <MessageSquare size={15} className="text-dark-400" />
        <span className="font-medium text-dark-100 text-sm">Portal Messages</span>
        {messages.filter((m) => m.sender === 'client').length > 0 && (
          <span className="ml-auto text-xs bg-accent text-white px-2 py-0.5 rounded-full">
            {messages.filter((m) => m.sender === 'client').length} from client
          </span>
        )}
      </div>

      <div className="p-4 space-y-3 min-h-[200px] max-h-[360px] overflow-y-auto bg-white/20 dark:bg-white/2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MessageSquare size={24} className="text-dark-400 mb-2" />
            <p className="text-dark-400 text-sm">No messages yet</p>
            <p className="text-xs text-dark-400 mt-1">Send the client a message via their portal</p>
          </div>
        ) : messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'designer' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
              msg.sender === 'designer'
                ? 'bg-accent text-white rounded-br-sm'
                : 'bg-white/60 dark:bg-white/10 text-dark-100 rounded-bl-sm border border-white/40 dark:border-white/8'
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <p className={`text-[10px] mt-0.5 ${msg.sender === 'designer' ? 'text-white/70' : 'text-dark-400'}`}>
                {msg.sender === 'designer' ? 'You' : 'Client'} &middot; {formatDate(msg.created_at)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 bg-white/30 dark:bg-white/5 border-t border-white/30 dark:border-white/8 flex gap-2">
        <input
          type="text"
          placeholder="Send a message to client..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          className="flex-1 bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-dark-100 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
