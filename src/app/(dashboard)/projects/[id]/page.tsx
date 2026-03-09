import { getDb, initDb } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Calendar, DollarSign, User } from 'lucide-react'
import type { Project, WorkApproval } from '@/types'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await initDb()
  const db = getDb()
  const projectResult = await db.execute({
    sql: 'SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ?',
    args: [id],
  })
  const project = projectResult.rows[0] as unknown as (Project & { client_name: string }) | undefined
  if (!project) notFound()

  const approvalsResult = await db.execute({ sql: 'SELECT * FROM work_approvals WHERE project_id = ? ORDER BY created_at DESC', args: [id] })
  const approvals = approvalsResult.rows as unknown as WorkApproval[]

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{project.name}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={project.status}>{project.status.replace('_', ' ')}</Badge>
              <Badge variant={project.priority}>{project.priority} priority</Badge>
              <span className="text-sm text-dark-300 flex items-center gap-1"><User size={14} /> {project.client_name}</span>
              {project.start_date && <span className="text-sm text-dark-300 flex items-center gap-1"><Calendar size={14} /> {formatDate(project.start_date)} - {formatDate(project.due_date)}</span>}
              {project.budget > 0 && <span className="text-sm text-dark-300 flex items-center gap-1"><DollarSign size={14} /> {formatCurrency(project.budget)}</span>}
            </div>
          </div>
        </div>
        {project.description && <p className="mt-4 text-dark-200 text-sm">{project.description}</p>}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-dark-300 mb-2"><span>Progress</span><span>{project.progress}%</span></div>
          <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-white mb-4">Work Approvals</h3>
        {approvals.length === 0 ? (
          <p className="text-dark-400 text-sm text-center py-6">No approvals submitted yet</p>
        ) : (
          <div className="space-y-3">
            {approvals.map((a) => (
              <div key={a.id} className="p-4 rounded-lg bg-dark-700/50 border border-dark-600">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">{a.title}</h4>
                  <Badge variant={a.status}>{a.status}</Badge>
                </div>
                <p className="text-sm text-dark-300">{a.description}</p>
                {a.client_feedback && (
                  <p className="text-sm text-dark-200 mt-2 bg-dark-700 p-2 rounded">Feedback: {a.client_feedback}</p>
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
