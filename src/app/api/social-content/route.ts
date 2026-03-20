import { NextRequest, NextResponse } from 'next/server'
import { generateWithAI, getAvailableProviders, type AIProvider, type AIMode } from '@/lib/ai-providers'

export const maxDuration = 60

export async function GET() {
  const providers = getAvailableProviders()
  return NextResponse.json({ available: Object.values(providers).some(Boolean), providers })
}

const BATCH_SIZE = 5

export async function POST(req: NextRequest) {
  const providers = getAvailableProviders()
  const { brand, count, platforms, contentTypes, formatPreference, notes, strategy, mode = 'quality', provider = 'claude' } = await req.json()

  const chosenProvider = provider as AIProvider
  const chosenMode = mode as AIMode

  if (!providers[chosenProvider]) {
    return NextResponse.json({ available: false, error: `${chosenProvider} API key not configured.` })
  }
  if (!brand) return NextResponse.json({ available: true, error: 'No brand data provided' })

  const platformList: string[] = platforms?.length ? platforms : ['Instagram', 'LinkedIn']
  const typeList = contentTypes?.length ? contentTypes.join(', ') : 'Lifestyle, Promotional'
  const postCount = Math.min(Math.max(Number(count) || 5, 1), 20)
  const isFast = chosenMode === 'fast'

  const formatInstructions: Record<string, string> = {
    'single': 'ALL posts must use "Single Image" format only.',
    'carousel': 'ALL posts must use "Carousel" format only.',
    'reel': 'ALL posts must use "Reel / Short Video" format only.',
    'mix-single-carousel': 'Mix between "Single Image" and "Carousel" formats only.',
    'mix-all': 'Vary between "Single Image", "Carousel", and "Reel / Short Video" formats.',
  }
  const formatInstruction = formatInstructions[formatPreference ?? 'mix-all']

  const captionRules: Record<string, string> = {
    'Instagram': 'Instagram: 1-3 punchy sentences. Max 60 words. Hashtags go separately.',
    'LinkedIn': 'LinkedIn: professional tone, 2-4 sentences, no hashtags. Max 80 words.',
    'Twitter / X': 'Twitter/X: one impactful sentence. Max 25 words. No hashtags.',
    'Facebook': 'Facebook: conversational, 2-3 warm sentences. Max 60 words.',
    'TikTok': 'TikTok: hook sentence only, energetic. Max 15 words.',
    'Pinterest': 'Pinterest: descriptive, keyword-rich, 1-2 sentences. Max 40 words.',
  }
  const captionInstructions = platformList
    .map(p => captionRules[p] ?? `${p}: 1-2 sentences, max 50 words.`)
    .join('\n')

  const brandContext = `BRAND:
Name: ${brand.brand.name}
Tagline: "${brand.brand.tagline}"
Industry: ${brand.brand.industry}
Concept: ${brand.brand.concept}
Personality: ${brand.strategy.personality}
Tone: ${brand.strategy.toneOfVoice}
Audience: ${brand.strategy.targetAudience}
Values: ${brand.strategy.values?.join(', ')}

VISUAL IDENTITY:
Primary Palette: ${brand.visualIdentity.primaryPalette.colors.join(', ')}
Secondary Palette: ${brand.visualIdentity.secondaryPalette.colors.join(', ')}
Fonts: ${brand.visualIdentity.typography.heading} (headings) + ${brand.visualIdentity.typography.body} (body)
Imagery Style: ${brand.visualIdentity.imageryStyle}
Design Principles: ${brand.visualIdentity.designPrinciples?.join(', ')}
Moodboard: ${brand.visualIdentity.moodboardKeywords?.join(', ')}`

  const strategyContext = strategy ? `CAMPAIGN STRATEGY:
${strategy.goals?.length ? `Goal(s): ${strategy.goals.join(', ')}` : ''}
${strategy.keyMessage ? `Key Message: ${strategy.keyMessage}` : ''}
${strategy.ctas?.length ? `Desired Audience Action: ${strategy.ctas.join(' / ')}` : ''}
${strategy.theme ? `Campaign Theme: ${strategy.theme}` : ''}
${strategy.emotions?.length ? `Emotional Tone: make the audience feel ${strategy.emotions.join(', ')}` : ''}

Every post must directly serve these strategic objectives. The key message should be woven naturally into the design copy and captions. CTAs should align with the desired action.` : ''

  const systemPrompt = `You are a senior social media creative director. Generate concise, platform-native content paired with precise visual direction for graphic designers. Design copy must be SHORT — it goes directly onto the graphic in large type.`

  const buildPrompt = (batchSize: number, startId: number, totalPosts: number) => `Generate ${batchSize} social media content pieces (numbered ${startId} to ${startId + batchSize - 1} of ${totalPosts} total) for this brand. Each piece is ONE design concept that works across all platforms, with caption variants per platform.

${brandContext}

${strategyContext}
REQUIREMENTS:
Platforms — provide a caption for EACH: ${platformList.join(', ')}
Content Types to distribute across posts: ${typeList}
Format rule: ${formatInstruction}
${notes ? `Extra direction: ${notes}` : ''}

CAPTION LENGTH RULES:
${captionInstructions}

Respond with ONLY valid JSON — no markdown, no extra text:
{
  "posts": [
    {
      "id": ${startId},
      "contentType": "Content type label",
      "format": "Single Image | Carousel | Reel / Short Video",
      "designCopy": {
        "headline": "3-6 words MAX for the graphic",
        "subtext": "8-15 words supporting text, or empty string",
        "cta": "2-4 word CTA"
      },
      "captions": {
        ${platformList.map(p => `"${p}": "Caption for ${p}"`).join(',\n        ')}
      },
      "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
      "visual": {
        "composition": "Precise layout description — what is in frame, placement, hierarchy.",
        "colorUsage": "Which hex colors go where — background, text, overlays, accents.",
        "typography": "Text on the design, font names, size hierarchy, placement.",
        "imagery": "Subject, lighting, angle, mood, props, environment. Specific enough to brief a photographer.",
        "mood": "2-4 descriptive words"
      }
    }
  ]
}

Critical rules:
- designCopy.headline: 3-6 words MAXIMUM — large type on the graphic
- designCopy.subtext: 8-15 words max or ""
- Every post MUST have a "captions" key with an entry for every platform: ${platformList.map(p => `"${p}"`).join(', ')}
- Hashtags: 4-6 tags, lowercase, no spaces
- Visual direction must use actual hex codes and actual font names from the brand identity
- Each concept must be visually and thematically distinct
- IDs must start at ${startId} and increment by 1`

  const batches: { start: number; size: number }[] = []
  let assigned = 0
  while (assigned < postCount) {
    const batchSize = Math.min(BATCH_SIZE, postCount - assigned)
    batches.push({ start: assigned + 1, size: batchSize })
    assigned += batchSize
  }

  const maxTokens = isFast
    ? Math.min(1000 + BATCH_SIZE * (280 + platformList.length * 80), 6000)
    : Math.min(1500 + BATCH_SIZE * (360 + platformList.length * 100), 8192)

  try {
    const batchResults = await Promise.all(
      batches.map(async ({ start, size }) => {
        const raw = await generateWithAI(systemPrompt, buildPrompt(size, start, postCount), chosenProvider, chosenMode, maxTokens)
        const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
        const parsed = JSON.parse(cleaned)
        return parsed.posts as unknown[]
      })
    )

    const allPosts = batchResults.flat()
    return NextResponse.json({ available: true, result: { posts: allPosts } })
  } catch (e) {
    const msg = e instanceof Error ? (e as Error).message : String(e)
    console.error('Social content generation failed:', msg)
    return NextResponse.json({ available: true, error: `Content generation failed: ${msg}` })
  }
}
