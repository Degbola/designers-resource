import { getDb } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Money } from '@/components/ui/money'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Calendar, DollarSign, User } from 'lucide-react'
import type { Project, WorkApproval } from '@/types'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const project = await db.prepare(
    'SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ?'
  ).bind(id).first<Project & { client_name: string }>()
  if (!project) notFound()

  const approvalsResult = await db.prepare(
    'SELECT * FROM work_approvals WHERE project_id = ? ORDER BY created_at DESC'
  ).bind(id).all<WorkApproval>()
  const approvals = approvalsResult.results

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-dark-100 transition-colors">
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-dark-100 mb-2">{project.name}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={project.status}>{project.status.replace('_', ' ')}</Badge>
              <Badge variant={project.priority}>{project.priority} priority</Badge>
              <span className="text-sm text-dark-300 flex items-center gap-1"><User size={14} /> {project.client_name}</span>
              {project.start_date && <span className="text-sm text-dark-300 flex items-center gap-1"><Calendar size={14} /> {formatDate(project.start_date)} - {formatDate(project.due_date)}</span>}
              {project.budget > 0 && <span className="text-sm text-dark-300 flex items-center gap-1"><DollarSign size={14} /> <Money amount={project.budget} /></span>}
            </div>
          </div>
        </div>
        {project.description && <p className="mt-4 text-dark-200 text-sm">{project.description}</p>}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-dark-300 mb-2"><span>Progress</span><span>{project.progress}%</span></div>
          <div className="h-2 bg-black/[0.04] dark:bg-white/[0.04] rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-dark-100 mb-4">Work Approvals</h3>
        {approvals.length === 0 ? (
          <p className="text-dark-400 text-sm text-center py-6">No approvals submitted yet</p>
        ) : (
          <div className="space-y-3">
            {approvals.map((a) => (
              <div key={a.id} className="p-4 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.07]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-dark-100">{a.title}</h4>
                  <Badge variant={a.status}>{a.status}</Badge>
                </div>
                <p className="text-sm text-dark-300">{a.description}</p>
                {a.client_feedback && (
                  <p className="text-sm text-dark-200 mt-2 bg-black/[0.05] dark:bg-white/[0.05] p-2 rounded">Feedback: {a.client_feedback}</p>
                )}
                <p className="text-xs text-dark-400 mt-2">{formatDate(a.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
