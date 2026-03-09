'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FolderKanban, FileText, CheckCircle, Clock } from 'lucide-react'

interface PortalData {
  client: { name: string; company: string; email: string }
  projects: { id: number; name: string; status: string; progress: number; due_date: string }[]
  invoices: { id: number; invoice_number: string; status: string; total: number; issue_date: string; due_date: string }[]
  approvals: { id: number; title: string; description: string; status: string; client_feedback: string; created_at: string; project_name: string }[]
}

export default function PortalPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<PortalData | null>(null)
  const [error, setError] = useState('')
  const [feedbackForm, setFeedbackForm] = useState<{ id: number; feedback: string } | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/portal/${token}`)
    if (res.ok) {
      setData(await res.json())
    } else {
      setError('Invalid portal link. Please contact the designer.')
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const submitApproval = async (approvalId: number, status: 'approved' | 'revision') => {
    await fetch(`/api/portal/${token}/approvals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approval_id: approvalId, status, feedback: feedbackForm?.feedback || '' }),
    })
    setFeedbackForm(null)
    load()
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <p className="text-red-400 text-lg">{error}</p>
      </Card>
    )
  }

  if (!data) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome, {data.client.name}</h1>
        {data.client.company && <p className="text-dark-300">{data.client.company}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-3 !p-4">
          <FolderKanban size={20} className="text-purple-400" />
          <div><p className="text-xs text-dark-400">Active Projects</p><p className="text-lg font-bold text-white">{data.projects.filter((p) => p.status !== 'completed').length}</p></div>
        </Card>
        <Card className="flex items-center gap-3 !p-4">
          <FileText size={20} className="text-amber-400" />
          <div><p className="text-xs text-dark-400">Pending Invoices</p><p className="text-lg font-bold text-white">{data.invoices.filter((i) => i.status === 'sent').length}</p></div>
        </Card>
        <Card className="flex items-center gap-3 !p-4">
          <Clock size={20} className="text-blue-400" />
          <div><p className="text-xs text-dark-400">Pending Approvals</p><p className="text-lg font-bold text-white">{data.approvals.filter((a) => a.status === 'pending').length}</p></div>
        </Card>
      </div>

      <Tabs tabs={[
        {
          id: 'projects', label: 'Projects',
          content: (
            <div className="space-y-3">
              {data.projects.length === 0 ? (
                <p className="text-dark-400 text-center py-8">No projects yet</p>
              ) : data.projects.map((p) => (
                <Card key={p.id} className="!p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-white">{p.name}</h3>
                    <Badge variant={p.status}>{p.status.replace('_', ' ')}</Badge>
                  </div>
                  {p.due_date && <p className="text-xs text-dark-400 mb-2">Due: {formatDate(p.due_date)}</p>}
                  <div className="flex justify-between text-xs text-dark-400 mb-1"><span>Progress</span><span>{p.progress}%</span></div>
                  <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${p.progress}%` }} />
                  </div>
                </Card>
              ))}
            </div>
          ),
        },
        {
          id: 'invoices', label: 'Invoices',
          content: (
            <div className="space-y-3">
              {data.invoices.length === 0 ? (
                <p className="text-dark-400 text-center py-8">No invoices yet</p>
              ) : data.invoices.map((inv) => (
                <Card key={inv.id} className="!p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{inv.invoice_number}</p>
                    <p className="text-xs text-dark-400">Issued: {formatDate(inv.issue_date)} &middot; Due: {formatDate(inv.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatCurrency(inv.total)}</p>
                    <Badge variant={inv.status}>{inv.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          ),
        },
        {
          id: 'approvals', label: 'Approvals',
          content: (
            <div className="space-y-3">
              {data.approvals.length === 0 ? (
                <p className="text-dark-400 text-center py-8">No items awaiting approval</p>
              ) : data.approvals.map((a) => (
                <Card key={a.id} className="!p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-white">{a.title}</h3>
                      <p className="text-xs text-dark-400">{a.project_name} &middot; {formatDate(a.created_at)}</p>
                    </div>
                    <Badge variant={a.status}>{a.status}</Badge>
                  </div>
                  {a.description && <p className="text-sm text-dark-300 mb-3">{a.description}</p>}
                  {a.client_feedback && <p className="text-sm text-dark-200 bg-dark-700 p-2 rounded mb-3">Your feedback: {a.client_feedback}</p>}
                  {a.status === 'pending' && (
                    <>
                      {feedbackForm?.id === a.id ? (
                        <div className="space-y-3">
                          <Textarea placeholder="Add feedback (optional)..." value={feedbackForm.feedback} onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })} />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => submitApproval(a.id, 'approved')}><CheckCircle size={14} /> Approve</Button>
                            <Button size="sm" variant="danger" onClick={() => submitApproval(a.id, 'revision')}>Request Revision</Button>
                            <Button size="sm" variant="ghost" onClick={() => setFeedbackForm(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => submitApproval(a.id, 'approved')}><CheckCircle size={14} /> Approve</Button>
                          <Button size="sm" variant="secondary" onClick={() => setFeedbackForm({ id: a.id, feedback: '' })}>Review with Feedback</Button>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              ))}
            </div>
          ),
        },
      ]} />
    </div>
  )
}
