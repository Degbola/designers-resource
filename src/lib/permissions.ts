import type { SafeUser } from '@/types'

export const ALL_PERMISSIONS = [
  'clients',
  'projects',
  'invoices',
  'finances',
  'resources',
  'brands',
  'social',
  'tools',
] as const

export type Permission = typeof ALL_PERMISSIONS[number]

export const PERMISSION_LABELS: Record<Permission, string> = {
  clients:  'Clients',
  projects: 'Projects',
  invoices: 'Invoices',
  finances: 'Finances',
  resources: 'Resources',
  brands:   'Brand Generator',
  social:   'Social Content',
  tools:    'Design Tools',
}

export const DEFAULT_PERMISSIONS = JSON.stringify(ALL_PERMISSIONS)

export function getPermissions(user: SafeUser): Permission[] {
  if (user.role === 'admin') return [...ALL_PERMISSIONS]
  try {
    return JSON.parse(user.permissions || DEFAULT_PERMISSIONS) as Permission[]
  } catch {
    return [...ALL_PERMISSIONS]
  }
}

export function hasPermission(user: SafeUser, permission: Permission): boolean {
  if (user.role === 'admin') return true
  return getPermissions(user).includes(permission)
}
