import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initDb()
  const db = getDb()
  const { id } = await params
  const result = await db.execute({
    sql: `SELECT result_json FROM brand_generations WHERE id = ?`,
    args: [id],
  })
  if (!result.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const parsed = JSON.parse(result.rows[0][0] as string)
  return NextResponse.json({ result: parsed })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initDb()
  const db = getDb()
  const { id } = await params
  await db.execute({ sql: `DELETE FROM brand_generations WHERE id = ?`, args: [id] })
  return NextResponse.json({ ok: true })
}
