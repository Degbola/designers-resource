'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

const STATUS_COLOR: Record<string, string> = {
  not_started: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  revision: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  draft: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[status] || STATUS_COLOR.draft}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-2xl p-5 border border-black/[0.07] dark:border-white/[0.08] ${className}`}>
      {children}
    </div>
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
    if (res.ok) {
      setData(await res.json())
    } else {
      setError('Invalid or expired portal link. Please contact your designer.')
    }
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
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-dark-100 mb-2">Link Not Found</h2>
        <p className="text-dark-400 text-sm max-w-xs">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const activeProjects = data.projects.filter((p) => p.status !== 'completed')
  const pendingInvoices = data.invoices.filter((i) => i.status === 'sent')
  const pendingApprovals = data.approvals.filter((a) => a.status === 'pending')
  const unreadMessages = data.messages.filter((m) => m.sender === 'designer').length
  const projectsWithDrive = data.projects.filter((p) => p.drive_folder_url)

  const tabs = [
    { id: 'projects', label: 'Projects', icon: FolderKanban, count: activeProjects.length },
    { id: 'invoices', label: 'Invoices', icon: FileText, count: pendingInvoices.length },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle, count: pendingApprovals.length },
    { id: 'files', label: 'Files', icon: Folder, count: projectsWithDrive.length },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: unreadMessages },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <Card className="!p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-dark-400 mb-1 uppercase tracking-wider font-medium">Welcome back</p>
            <h1 className="text-2xl font-display font-bold text-dark-100 tracking-tight">{data.client.name}</h1>
            {data.client.company && <p className="text-dark-400 text-sm mt-0.5">{data.client.company}</p>}
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <TrendingUp size={22} className="text-accent" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Active Projects', value: activeProjects.length, icon: FolderKanban, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Pending Invoices', value: pendingInvoices.length, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Awaiting Approval', value: pendingApprovals.length, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { label: 'File Folders', value: projectsWithDrive.length, icon: HardDrive, color: 'text-accent', bg: 'bg-accent/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-3 flex items-center gap-2.5`}>
              <Icon size={16} className={color} />
              <div>
                <p className="text-lg font-bold text-dark-100 leading-none">{value}</p>
                <p className="text-[10px] text-dark-400 mt-0.5 leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl p-1 border border-black/[0.07] dark:border-white/[0.08] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-white/10 text-dark-100 shadow-sm'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isActive ? 'bg-accent text-white' : 'bg-dark-500/30 text-dark-300'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Projects tab */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {data.projects.length === 0 ? (
            <Card className="text-center py-12">
              <FolderKanban size={32} className="mx-auto text-dark-400 mb-3" />
              <p className="text-dark-400">No projects yet</p>
            </Card>
          ) : data.projects.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-dark-100">{p.name}</h3>
                  {p.description && <p className="text-sm text-dark-400 mt-0.5 line-clamp-2">{p.description}</p>}
                </div>
                <StatusPill status={p.status} />
              </div>
              {p.due_date && (
                <p className="text-xs text-dark-400 mb-3 flex items-center gap-1">
                  <Clock size={11} /> Due {formatDate(p.due_date)}
                </p>
              )}
              <div className="flex justify-between text-xs text-dark-400 mb-1.5">
                <span>Progress</span><span className="font-medium text-dark-200">{p.progress}%</span>
              </div>
              <div className="h-2 bg-black/[0.04] dark:bg-white/[0.04] rounded-full overflow-hidden">
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
                  className="inline-flex items-center gap-2 mt-4 text-sm text-accent hover:text-accent-hover font-medium transition-colors"
                >
                  <HardDrive size={14} /> View project files <ExternalLink size={11} />
                </a>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Invoices tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {data.invoices.length === 0 ? (
            <Card className="text-center py-12">
              <FileText size={32} className="mx-auto text-dark-400 mb-3" />
              <p className="text-dark-400">No invoices yet</p>
            </Card>
          ) : data.invoices.map((inv) => (
            <Card key={inv.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-dark-100">{inv.invoice_number}</p>
                <p className="text-xs text-dark-400 mt-0.5">
                  Issued {formatDate(inv.issue_date)}
                  {inv.due_date && <> &middot; Due {formatDate(inv.due_date)}</>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-dark-100 text-lg">{formatCurrency(inv.total)}</p>
                <StatusPill status={inv.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Approvals tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {data.approvals.length === 0 ? (
            <Card className="text-center py-12">
              <CheckCircle size={32} className="mx-auto text-dark-400 mb-3" />
              <p className="text-dark-400">No approvals pending</p>
            </Card>
          ) : data.approvals.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-semibold text-dark-100">{a.title}</h3>
                  <p className="text-xs text-dark-400 mt-0.5">{a.project_name} &middot; {formatDate(a.created_at)}</p>
                </div>
                <StatusPill status={a.status} />
              </div>
              {a.description && <p className="text-sm text-dark-300 mb-3">{a.description}</p>}
              {a.client_feedback && (
                <div className="text-sm text-dark-200 bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.07] dark:border-white/[0.08] p-3 rounded-xl mb-3">
                  <p className="text-xs text-dark-400 mb-1 font-medium">Your feedback</p>
                  {a.client_feedback}
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
                        className="w-full bg-black/[0.05] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-dark-100 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={() => submitApproval(a.id, 'approved')}>
                          <CheckCircle size={14} /> Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => submitApproval(a.id, 'revision')}>
                          Request Revision
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setFeedbackForm(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Button size="sm" onClick={() => submitApproval(a.id, 'approved')}>
                        <CheckCircle size={14} /> Approve
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setFeedbackForm({ id: a.id, feedback: '' })}>
                        Review with Feedback <ChevronRight size={12} />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Files tab */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <Card className="!p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/40 dark:border-blue-500/10">
            <div className="flex items-start gap-3">
              <HardDrive size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-dark-300">
                Your project files are stored in Google Drive. Click the folder link for each project to access your deliverables. Make sure you're signed in to the Google account your designer shared with.
              </p>
            </div>
          </Card>
          {data.projects.length === 0 ? (
            <Card className="text-center py-12">
              <Folder size={32} className="mx-auto text-dark-400 mb-3" />
              <p className="text-dark-400">No projects yet</p>
            </Card>
          ) : data.projects.map((p) => (
            <Card key={p.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.drive_folder_url ? 'bg-accent/10' : 'bg-dark-500/20'}`}>
                  <Folder size={18} className={p.drive_folder_url ? 'text-accent' : 'text-dark-400'} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-dark-100 truncate">{p.name}</p>
                  <StatusPill status={p.status} />
                </div>
              </div>
              {p.drive_folder_url ? (
                <a
                  href={p.drive_folder_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors shrink-0"
                >
                  Open <ExternalLink size={13} />
                </a>
              ) : (
                <span className="text-xs text-dark-400 shrink-0">Coming soon</span>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Messages tab */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <Card className="!p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.07]">
              <h3 className="font-semibold text-dark-100 text-sm">Conversation with your designer</h3>
            </div>
            <div className="p-4 space-y-3 min-h-[280px] max-h-[480px] overflow-y-auto">
              {data.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <MessageSquare size={28} className="text-dark-400 mb-2" />
                  <p className="text-dark-400 text-sm">No messages yet</p>
                  <p className="text-dark-400 text-xs mt-1">Send a message to start the conversation</p>
                </div>
              ) : data.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.sender === 'client'
                      ? 'bg-accent text-white rounded-br-sm'
                      : 'bg-white/60 dark:bg-white/[0.06] text-dark-100 rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender === 'client' ? 'text-white/70' : 'text-dark-400'}`}>
                      {msg.sender === 'designer' ? 'Designer' : 'You'} &middot; {formatDate(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="px-4 py-3 border-t border-black/[0.06] dark:border-white/[0.07] flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                className="flex-1 bg-black/[0.05] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-dark-100 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              <button
                onClick={sendMessage}
                disabled={sendingMsg || !newMessage.trim()}
                className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                <Send size={16} />
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
