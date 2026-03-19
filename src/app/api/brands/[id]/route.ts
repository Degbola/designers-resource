import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb()
  const { id } = await params
  const row = await db.prepare(`SELECT result_json FROM brand_generations WHERE id = ?`)
    .bind(id)
    .first<{ result_json: string }>()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const parsed = JSON.parse(row.result_json)
  return NextResponse.json({ result: parsed })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb()
  const { id } = await params
  await db.prepare(`DELETE FROM brand_generations WHERE id = ?`).bind(id).run()
  return NextResponse.json({ ok: true })
}
