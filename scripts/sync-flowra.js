// Temporary script — extracts Flowra data from local DB and pushes to production
// Usage: node scripts/sync-flowra.js <YOUR_RAILWAY_URL>
// Example: node scripts/sync-flowra.js https://your-app.up.railway.app

const { createClient } = require('@libsql/client')
const path = require('path')

const PRODUCTION_URL = process.argv[2]
if (!PRODUCTION_URL) {
  console.error('Usage: node scripts/sync-flowra.js <PRODUCTION_URL>')
  console.error('Example: node scripts/sync-flowra.js https://your-app.up.railway.app')
  process.exit(1)
}

async function main() {
  const db = createClient({ url: 'file:' + path.join(__dirname, '..', 'data', 'designer-hub.db') })

  // Extract Flowra brand data
  const brands = await db.execute("SELECT * FROM brand_generations WHERE brand_name LIKE '%lowra%'")
  const socialContent = await db.execute("SELECT * FROM social_content_history WHERE brand_name LIKE '%lowra%'")

  console.log(`Found ${brands.rows.length} brand(s) and ${socialContent.rows.length} social content generation(s)`)

  const payload = {
    secret: 'flowra-sync-2026',
    brands: brands.rows.map(r => ({
      brand_name: r.brand_name,
      tagline: r.tagline,
      industry: r.industry,
      prompt: r.prompt,
      result_json: r.result_json,
      created_at: r.created_at,
    })),
    socialContent: socialContent.rows.map(r => ({
      brand_name: r.brand_name,
      platforms: r.platforms,
      content_types: r.content_types,
      format_preference: r.format_preference,
      post_count: r.post_count,
      posts_json: r.posts_json,
      created_at: r.created_at,
    })),
  }

  console.log(`Pushing to ${PRODUCTION_URL}/api/sync-data ...`)

  const res = await fetch(`${PRODUCTION_URL}/api/sync-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (data.ok) {
    console.log('Synced successfully!')
    data.synced.forEach(s => console.log(`  - ${s}`))
  } else {
    console.error('Sync failed:', data)
  }
}

main().catch(console.error)
