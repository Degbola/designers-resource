import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()

  const resource = await db.prepare('SELECT is_favorite FROM resources WHERE id = ?')
    .bind(id)
    .first<{ is_favorite: number }>()
  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newValue = resource.is_favorite ? 0 : 1
  await db.prepare('UPDATE resources SET is_favorite = ? WHERE id = ?').bind(newValue, id).run()

  const updated = await db.prepare('SELECT * FROM resources WHERE id = ?').bind(id).first()
  return NextResponse.json(updated)
}
