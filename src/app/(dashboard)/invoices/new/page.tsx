import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CreateInvoiceClient } from './_ClientPage'
import type { BrandSettings } from '@/app/api/brand-settings/route'
import type { Client, Project } from '@/types'

export default async function NewInvoicePage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const db = getDb()
  const [clientsResult, projectsResult, brandRow] = await Promise.all([
    db.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY name').bind(user.id).all<Client>(),
    db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY name').bind(user.id).all<Project>(),
    db.prepare('SELECT * FROM user_brand_settings WHERE user_id = ?').bind(user.id).first<BrandSettings>(),
  ])

  const s = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
  const brand: BrandSettings = brandRow ? s(brandRow) : {
    logo_url: '',
    brand_color: '#1A4332',
    accent_color: '#52b788',
    business_name: user.name,
    business_email: user.email,
    business_address: '',
    business_phone: '',
    default_template: 'classic',
    default_terms: '',
    font_family: 'Inter',
    font_weight: 400,
    default_theme: 'light',
  }

  return (
    <CreateInvoiceClient
      clients={s(clientsResult.results)}
      projects={s(projectsResult.results)}
      brand={brand}
    />
  )
}
