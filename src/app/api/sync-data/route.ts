import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

// TEMPORARY endpoint — remove after syncing Flowra data
const SYNC_SECRET = 'flowra-sync-2026'

export async function POST(req: NextRequest) {
  const { secret, brands, socialContent } = await req.json()

  if (secret !== SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await initDb()
  const db = getDb()
  const results: string[] = []

  // Insert brand generations
  if (brands && Array.isArray(brands)) {
    for (const b of brands) {
      await db.execute({
        sql: `INSERT INTO brand_generations (brand_name, tagline, industry, prompt, result_json, created_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [b.brand_name, b.tagline || '', b.industry || '', b.prompt || '', b.result_json, b.created_at],
      })
      results.push(`Brand: ${b.brand_name}`)
    }
  }

  // Insert social content history
  if (socialContent && Array.isArray(socialContent)) {
    for (const s of socialContent) {
      await db.execute({
        sql: `INSERT INTO social_content_history (brand_name, platforms, content_types, format_preference, post_count, posts_json, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [s.brand_name, s.platforms || '', s.content_types || '', s.format_preference || '', s.post_count || 0, s.posts_json, s.created_at],
      })
      results.push(`Social content: ${s.brand_name} (${s.post_count} posts)`)
    }
  }

  return NextResponse.json({ ok: true, synced: results })
}
