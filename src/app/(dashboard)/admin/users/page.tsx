'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, ShieldOff, Trash2, UserCheck, UserX, Users } from 'lucide-react'

interface AdminUser {
  id: number
  email: string
  name: string
  role: 'admin' | 'member'
  is_active: number
  created_at: string
  client_count: number
  project_count: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.status === 403) {
      setError('Access denied — admin only.')
      setLoading(false)
      return
    }
    setUsers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const action = async (id: number, act: string) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: act }),
    })
    load()
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete user "${name}" and ALL their data permanently? This cannot be undone.`)) return
    await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
    load()
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
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
          {users.map(user => (
            <Card key={user.id} className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{user.name}</span>
                      <Badge variant={user.role === 'admin' ? 'success' : 'default'}>
                        {user.role}
                      </Badge>
                      {!user.is_active && (
                        <Badge variant="danger">inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-muted)] truncate">{user.email}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {user.client_count} client{user.client_count !== 1 ? 's' : ''} · {user.project_count} project{user.project_count !== 1 ? 's' : ''} · joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {user.is_active ? (
                    <Button size="sm" variant="ghost" onClick={() => action(user.id, 'deactivate')} title="Deactivate account">
                      <UserX className="w-4 h-4 mr-1" /> Deactivate
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => action(user.id, 'activate')} title="Activate account">
                      <UserCheck className="w-4 h-4 mr-1" /> Activate
                    </Button>
                  )}

                  {user.role === 'member' ? (
                    <Button size="sm" variant="ghost" onClick={() => action(user.id, 'make_admin')} title="Promote to admin">
                      <Shield className="w-4 h-4 mr-1" /> Make Admin
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => action(user.id, 'make_member')} title="Demote to member">
                      <ShieldOff className="w-4 h-4 mr-1" /> Make Member
                    </Button>
                  )}

                  <Button size="sm" variant="danger" onClick={() => handleDelete(user.id, user.name)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
