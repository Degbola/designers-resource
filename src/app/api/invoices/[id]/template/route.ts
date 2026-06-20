import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'

const VALID_TEMPLATES = ['classic', 'structured', 'bold', 'banner', 'minimal']

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as { template_id?: string; brand_color?: string; accent_color?: string; logo_url?: string; terms?: string; font_family?: string; font_weight?: number; theme?: string }

  if (body.template_id && !VALID_TEMPLATES.includes(body.template_id)) {
    return NextResponse.json({ error: 'Invalid template' }, { status: 400 })
  }

  const db = getDb()
  const existing = await db.prepare('SELECT id FROM invoices WHERE id = ? AND user_id = ?').bind(id, user.id).first()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates: string[] = []
  const args: (string | number)[] = []
  if (body.template_id !== undefined) { updates.push('template_id = ?'); args.push(body.template_id) }
  if (body.brand_color !== undefined) { updates.push('brand_color = ?'); args.push(body.brand_color) }
  if (body.accent_color !== undefined) { updates.push('accent_color = ?'); args.push(body.accent_color) }
  if (body.logo_url !== undefined) { updates.push('logo_url = ?'); args.push(body.logo_url) }
  if (body.terms !== undefined) { updates.push('terms = ?'); args.push(body.terms) }
  if (body.font_family !== undefined) { updates.push('font_family = ?'); args.push(body.font_family) }
  if (body.font_weight !== undefined) { updates.push('font_weight = ?'); args.push(body.font_weight) }
  if (body.theme !== undefined) { updates.push('theme = ?'); args.push(body.theme) }

  if (updates.length === 0) return NextResponse.json({ success: true })

  await db.prepare(`UPDATE invoices SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...args, id, user.id).run()

  return NextResponse.json({ success: true })
}
