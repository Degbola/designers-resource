'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  FolderKanban, FileText, CheckCircle, Clock, MessageSquare,
  HardDrive, ExternalLink, ChevronRight, Send, AlertCircle,
  TrendingUp, Folder,
} from 'lucide-react'

interface Message { id: number; sender: 'designer' | 'client'; content: string; created_at: string }
interface PortalData {
  client: { name: string; company: string; email: string }
  projects: { id: number; name: string; status: string; progress: number; due_date: string; description: string; drive_folder_url: string }[]
  invoices: { id: number; invoice_number: string; status: string; total: number; issue_date: string; due_date: string }[]
  approvals: { id: number; title: string; description: string; status: string; client_feedback: string; created_at: string; project_name: string }[]
  messages: Message[]
}

// Matches the dashboard Badge / status pill palette
const STATUS_PILL: Record<string, string> = {
  not_started: 'bg-black/[0.04] text-dark-400',
  in_progress:  'bg-accent/10 text-accent',
  review:       'bg-amber-100 text-amber-700',
  completed:    'bg-accent/15 text-accent',
  pending:      'bg-amber-100 text-amber-700',
  approved:     'bg-accent/15 text-accent',
  revision:     'bg-red-100 text-red-600',
  draft:        'bg-black/[0.04] text-dark-400',
  sent:         'bg-accent/10 text-accent',
  paid:         'bg-accent/15 text-accent',
  overdue:      'bg-red-100 text-red-600',
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${STATUS_PILL[status] ?? STATUS_PILL.draft}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

// Matches dashboard Card component
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass p-5 ${className}`}>{children}</div>
}

// Section label — mirrors dashboard's uppercase accent labels
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-dark-400 font-semibold mb-4">{children}</p>
  )
}

export default function PortalPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<PortalData | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('projects')
  const [feedbackForm, setFeedbackForm] = useState<{ id: number; feedback: string } | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/portal/${token}`)
    if (res.ok) { setData(await res.json()) }
    else { setError('Invalid or expired portal link. Please contact your designer.') }
  }, [token])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (activeTab === 'messages') {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [activeTab, data?.messages])

  const submitApproval = async (approvalId: number, status: 'approved' | 'revision') => {
    await fetch(`/api/portal/${token}/approvals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approval_id: approvalId, status, feedback: feedbackForm?.feedback || '' }),
    })
    setFeedbackForm(null)
    load()
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    setSendingMsg(true)
    await fetch(`/api/portal/${token}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newMessage.trim() }),
    })
    setNewMessage('')
    setSendingMsg(false)
    load()
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center animate-fade-in">
        <div className="glass w-14 h-14 flex items-center justify-center mb-5">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <h2 className="font-serif text-xl text-dark-100 mb-2">Link Not Found</h2>
        <p className="text-dark-400 text-sm max-w-xs leading-relaxed">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="w-6 h-6 border border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const activeProjects   = data.projects.filter((p) => p.status !== 'completed')
  const pendingInvoices  = data.invoices.filter((i) => i.status === 'sent')
  const pendingApprovals = data.approvals.filter((a) => a.status === 'pending')
  const unreadMessages   = data.messages.filter((m) => m.sender === 'designer').length
  const projectsWithDrive = data.projects.filter((p) => p.drive_folder_url)

  const tabs = [
    { id: 'projects',  label: 'Projects',  icon: FolderKanban,  count: activeProjects.length },
    { id: 'invoices',  label: 'Invoices',  icon: FileText,      count: pendingInvoices.length },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle,   count: pendingApprovals.length },
    { id: 'files',     label: 'Files',     icon: Folder,        count: projectsWithDrive.length },
    { id: 'messages',  label: 'Messages',  icon: MessageSquare, count: unreadMessages },
  ]

  const stats = [
    { label: 'Active',   value: activeProjects.length,    icon: FolderKanban, style: 'bg-stat-mint   text-accent' },
    { label: 'Invoices', value: pendingInvoices.length,   icon: FileText,     style: 'bg-stat-peach  text-orange-700' },
    { label: 'Pending',  value: pendingApprovals.length,  icon: Clock,        style: 'bg-stat-lavender text-indigo-700' },
    { label: 'Files',    value: projectsWithDrive.length, icon: HardDrive,    style: 'bg-stat-sky    text-sky-700' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Welcome card ──────────────────────────── */}
      <Card className="!p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-dark-400 font-semibold mb-1.5">Welcome back</p>
            <h1 className="font-serif text-2xl text-dark-100 leading-tight">{data.client.name}</h1>
            {data.client.company && <p className="text-dark-400 text-sm mt-0.5">{data.client.company}</p>}
          </div>
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-accent" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {stats.map(({ label, value, icon: Icon, style }) => (
            <div key={label} className={`${style} rounded-lg p-3`}>
              <Icon size={14} className="mb-1.5 opacity-70" />
              <p className="text-xl font-bold leading-none">{value}</p>
              <p className="text-[10px] mt-1 opacity-60 font-medium uppercase tracking-wider leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Tabs — mirrors dashboard Tabs component ── */}
      <div className="glass p-1 flex gap-0.5 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-all whitespace-nowrap flex-1 justify-center cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-white/10 text-dark-100 shadow-sm'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-black/[0.04]'
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${isActive ? 'bg-accent text-white' : 'bg-black/[0.05] text-dark-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Projects ────────────────────────────────── */}
      {activeTab === 'projects' && (
        <div className="space-y-3">
          <SectionLabel>Your Projects</SectionLabel>
          {data.projects.length === 0 ? (
            <Card className="text-center py-14">
              <FolderKanban size={28} className="mx-auto text-dark-400 mb-3 opacity-40" />
              <p className="text-dark-400 text-sm">No projects yet</p>
            </Card>
          ) : data.projects.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-dark-100 truncate">{p.name}</h3>
                  {p.description && <p className="text-xs text-dark-400 mt-0.5 line-clamp-2 leading-relaxed">{p.description}</p>}
                </div>
                <StatusPill status={p.status} />
              </div>
              {p.due_date && (
                <p className="text-[11px] text-dark-400 mb-3 flex items-center gap-1">
                  <Clock size={10} /> Due {formatDate(p.due_date)}
                </p>
              )}
              <div className="flex justify-between text-[11px] text-dark-400 mb-1.5">
                <span>Progress</span>
                <span className="font-semibold text-dark-200">{p.progress}%</span>
              </div>
              <div className="neuro-inset h-1.5">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-700"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
              {p.drive_folder_url && (
                <a
                  href={p.drive_folder_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 text-[11px] text-accent hover:text-accent-hover font-semibold transition-colors"
                >
                  <HardDrive size={12} /> View project files <ExternalLink size={10} />
                </a>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── Invoices ────────────────────────────────── */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          <SectionLabel>Invoices</SectionLabel>
          {data.invoices.length === 0 ? (
            <Card className="text-center py-14">
              <FileText size={28} className="mx-auto text-dark-400 mb-3 opacity-40" />
              <p className="text-dark-400 text-sm">No invoices yet</p>
            </Card>
          ) : data.invoices.map((inv) => (
            <Card key={inv.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-dark-100">{inv.invoice_number}</p>
                <p className="text-[11px] text-dark-400 mt-0.5">
                  Issued {formatDate(inv.issue_date)}
                  {inv.due_date && <> · Due {formatDate(inv.due_date)}</>}
                </p>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="font-bold text-dark-100">{formatCurrency(inv.total)}</p>
                <StatusPill status={inv.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Approvals ───────────────────────────────── */}
      {activeTab === 'approvals' && (
        <div className="space-y-3">
          <SectionLabel>Approvals</SectionLabel>
          {data.approvals.length === 0 ? (
            <Card className="text-center py-14">
              <CheckCircle size={28} className="mx-auto text-dark-400 mb-3 opacity-40" />
              <p className="text-dark-400 text-sm">No approvals pending</p>
            </Card>
          ) : data.approvals.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-semibold text-dark-100">{a.title}</h3>
                  <p className="text-[11px] text-dark-400 mt-0.5">{a.project_name} · {formatDate(a.created_at)}</p>
                </div>
                <StatusPill status={a.status} />
              </div>
              {a.description && (
                <p className="text-sm text-dark-300 mb-3 leading-relaxed">{a.description}</p>
              )}
              {a.client_feedback && (
                <div className="bg-black/[0.03] border-l-2 border-accent/30 pl-3 py-2 pr-3 rounded-r mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-dark-400 font-semibold mb-1">Your feedback</p>
                  <p className="text-sm text-dark-200">{a.client_feedback}</p>
                </div>
              )}
              {a.status === 'pending' && (
                <>
                  {feedbackForm?.id === a.id ? (
                    <div className="space-y-3 mt-3">
                      <textarea
                        placeholder="Add feedback (optional)..."
                        value={feedbackForm.feedback}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                        className="w-full input-vellum rounded py-2.5 text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => submitApproval(a.id, 'approved')}
                          className="px-4 py-2 bg-accent text-white text-xs font-semibold rounded hover:bg-accent-hover transition-colors cursor-pointer flex items-center gap-1.5 btn-glow"
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button
                          onClick={() => submitApproval(a.id, 'revision')}
                          className="px-4 py-2 bg-red-50 text-red-600 text-xs font-semibold rounded hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          Request Revision
                        </button>
                        <button
                          onClick={() => setFeedbackForm(null)}
                          className="px-4 py-2 text-dark-400 text-xs font-semibold rounded hover:bg-black/[0.04] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => submitApproval(a.id, 'approved')}
                        className="px-4 py-2 bg-accent text-white text-xs font-semibold rounded hover:bg-accent-hover transition-colors cursor-pointer flex items-center gap-1.5 btn-glow"
                      >
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button
                        onClick={() => setFeedbackForm({ id: a.id, feedback: '' })}
                        className="px-4 py-2 bg-black/[0.04] text-dark-300 text-xs font-semibold rounded hover:bg-black/[0.07] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        Review with Feedback <ChevronRight size={11} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── Files ──────────────────────────────────── */}
      {activeTab === 'files' && (
        <div className="space-y-3">
          <SectionLabel>Project Files</SectionLabel>
          {/* Info strip */}
          <div className="flex items-start gap-3 px-4 py-3 bg-accent/5 border border-accent/10 rounded">
            <HardDrive size={14} className="text-accent mt-0.5 shrink-0" />
            <p className="text-[11px] text-dark-300 leading-relaxed">
              Files are stored in Google Drive. Sign in with the Google account your designer shared with to access them.
            </p>
          </div>
          {data.projects.length === 0 ? (
            <Card className="text-center py-14">
              <Folder size={28} className="mx-auto text-dark-400 mb-3 opacity-40" />
              <p className="text-dark-400 text-sm">No projects yet</p>
            </Card>
          ) : data.projects.map((p) => (
            <Card key={p.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${p.drive_folder_url ? 'bg-accent/10' : 'bg-black/[0.04]'}`}>
                  <Folder size={16} className={p.drive_folder_url ? 'text-accent' : 'text-dark-400'} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-dark-100 text-sm truncate">{p.name}</p>
                  <div className="mt-0.5"><StatusPill status={p.status} /></div>
                </div>
              </div>
              {p.drive_folder_url ? (
                <a
                  href={p.drive_folder_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-accent text-white rounded text-[11px] font-semibold hover:bg-accent-hover transition-colors shrink-0 btn-glow"
                >
                  Open <ExternalLink size={11} />
                </a>
              ) : (
                <span className="text-[11px] text-dark-400 shrink-0">Not linked</span>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── Messages ───────────────────────────────── */}
      {activeTab === 'messages' && (
        <div>
          <SectionLabel>Conversation</SectionLabel>
          <Card className="!p-0 overflow-hidden">
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-black/[0.06]">
              <p className="text-xs font-semibold text-dark-200">Your designer</p>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-3 min-h-[260px] max-h-[440px] overflow-y-auto">
              {data.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <MessageSquare size={24} className="text-dark-400 mb-2 opacity-40" />
                  <p className="text-dark-400 text-sm">No messages yet</p>
                  <p className="text-[11px] text-dark-400 mt-1">Send a message to start the conversation</p>
                </div>
              ) : data.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[72%] px-4 py-2.5 rounded ${
                    msg.sender === 'client'
                      ? 'bg-accent text-white rounded-br-none'
                      : 'glass text-dark-100 rounded-bl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1.5 ${msg.sender === 'client' ? 'text-white/60' : 'text-dark-400'}`}>
                      {msg.sender === 'designer' ? 'Designer' : 'You'} · {formatDate(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-black/[0.06] flex gap-2 items-center">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                className="flex-1 input-vellum rounded py-2 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={sendingMsg || !newMessage.trim()}
                className="w-9 h-9 rounded bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
