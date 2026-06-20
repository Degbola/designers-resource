import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { redirect } from 'next/navigation'
import { BrandSettingsClient } from './_ClientPage'
import type { BrandSettings } from '@/app/api/brand-settings/route'

const DEFAULTS: BrandSettings = {
  logo_url: '',
  brand_color: '#1A4332',
  accent_color: '#52b788',
  business_name: '',
  business_email: '',
  business_address: '',
  business_phone: '',
  default_template: 'classic',
  default_terms: '',
  font_family: 'Inter',
  font_weight: 400,
  default_theme: 'light',
}

export default async function BrandSettingsPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const db = getDb()
  const row = await db.prepare('SELECT * FROM user_brand_settings WHERE user_id = ?')
    .bind(user.id).first<BrandSettings>()

  const initial: BrandSettings = row
    ? { ...DEFAULTS, ...JSON.parse(JSON.stringify(row)) }
    : { ...DEFAULTS, business_name: user.name, business_email: user.email }

  return <BrandSettingsClient initial={initial} />
}
