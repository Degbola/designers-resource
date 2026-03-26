'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, ShieldOff, Trash2, UserCheck, UserX, Users, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { ALL_PERMISSIONS, PERMISSION_LABELS, type Permission } from '@/lib/permissions'

interface AdminUser {
  id: number
  email: string
  name: string
  role: 'admin' | 'member'
  is_active: number
  permissions: string
  created_at: string
  client_count: number
  project_count: number
}

function parsePermissions(raw: string): Permission[] {
  try { return JSON.parse(raw || '[]') } catch { return [...ALL_PERMISSIONS] }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.status === 403) { setError('Access denied — admin only.'); setLoading(false); return }
    setUsers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const action = async (id: number, act: string, extra?: Record<string, unknown>) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: act, ...extra }),
    })
    load()
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}" and ALL their data permanently? This cannot be undone.`)) return
    await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
    load()
  }

  const togglePermission = async (user: AdminUser, perm: Permission) => {
    const current = parsePermissions(user.permissions)
    const updated = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm]
    setSavingId(user.id)
    await action(user.id, 'set_permissions', { permissions: updated })
    setSavingId(null)
  }

  const setAllPermissions = async (user: AdminUser, all: boolean) => {
    setSavingId(user.id)
    await action(user.id, 'set_permissions', { permissions: all ? [...ALL_PERMISSIONS] : [] })
    setSavingId(null)
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-lg font-medium">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6" />
        <div>
          <h1 className="text-2xl font-display font-semibold">User Management</h1>
          <p className="text-sm text-[var(--text-muted)]">{users.length} account{users.length !== 1 ? 's' : ''} registered</p>
        </div>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-[var(--text-muted)]">Loading...</Card>
      ) : (
        <div className="space-y-3">
          {users.map(user => {
            const perms = parsePermissions(user.permissions)
            const isExpanded = expandedId === user.id
            const isSaving = savingId === user.id

            return (
              <Card key={user.id} className="overflow-hidden">
                {/* User row */}
                <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{user.name}</span>
                        <Badge variant={user.role === 'admin' ? 'admin' : 'member'}>{user.role}</Badge>
                        {!user.is_active && <Badge variant="danger">inactive</Badge>}
                      </div>
                      <p className="text-sm text-[var(--text-muted)] truncate">{user.email}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {user.client_count} client{user.client_count !== 1 ? 's' : ''} · {user.project_count} project{user.project_count !== 1 ? 's' : ''} · joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {user.role !== 'admin' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId(isExpanded ? null : user.id)}
                        title="Manage access"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                        Access
                      </Button>
                    )}

                    {user.is_active ? (
                      <Button size="sm" variant="ghost" onClick={() => action(user.id, 'deactivate')}>
                        <UserX className="w-4 h-4 mr-1" /> Deactivate
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => action(user.id, 'activate')}>
                        <UserCheck className="w-4 h-4 mr-1" /> Activate
                      </Button>
                    )}

                    {user.role === 'member' ? (
                      <Button size="sm" variant="ghost" onClick={() => action(user.id, 'make_admin')}>
                        <Shield className="w-4 h-4 mr-1" /> Make Admin
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => action(user.id, 'make_member')}>
                        <ShieldOff className="w-4 h-4 mr-1" /> Make Member
                      </Button>
                    )}

                    <Button size="sm" variant="danger" onClick={() => handleDelete(user.id, user.name)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Permissions panel */}
                {isExpanded && user.role !== 'admin' && (
                  <div className="border-t border-[var(--border)] px-4 py-4 bg-[var(--surface-2,rgba(0,0,0,0.03))]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-display font-semibold tracking-widest uppercase text-[var(--text-muted)]">
                        Section Access {isSaving && <span className="ml-2 opacity-60">Saving...</span>}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAllPermissions(user, true)}
                          className="text-xs text-[var(--accent)] hover:underline cursor-pointer"
                        >
                          Grant all
                        </button>
                        <span className="text-[var(--text-muted)] text-xs">·</span>
                        <button
                          onClick={() => setAllPermissions(user, false)}
                          className="text-xs text-[var(--text-muted)] hover:underline cursor-pointer"
                        >
                          Revoke all
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ALL_PERMISSIONS.map(perm => {
                        const granted = perms.includes(perm)
                        return (
                          <button
                            key={perm}
                            onClick={() => togglePermission(user, perm)}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer disabled:opacity-50 ${
                              granted
                                ? 'border-emerald-500/40 text-emerald-700 bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                                : 'border-red-400/40 text-red-600 bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20'
                            }`}
                          >
                            {granted
                              ? <Check className="w-3.5 h-3.5 shrink-0" />
                              : <X className="w-3.5 h-3.5 shrink-0" />
                            }
                            {PERMISSION_LABELS[perm]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {isExpanded && user.role === 'admin' && (
                  <div className="border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    Admins always have full access to all sections.
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
