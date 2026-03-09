import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await initDb()
  const db = getDb()

  const result = await db.execute({ sql: 'SELECT is_favorite FROM resources WHERE id = ?', args: [id] })
  const resource = result.rows[0] as unknown as { is_favorite: number } | undefined
  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newValue = resource.is_favorite ? 0 : 1
  await db.execute({ sql: 'UPDATE resources SET is_favorite = ? WHERE id = ?', args: [newValue, id] })

  const updatedResult = await db.execute({ sql: 'SELECT * FROM resources WHERE id = ?', args: [id] })
  return NextResponse.json(updatedResult.rows[0])
}
