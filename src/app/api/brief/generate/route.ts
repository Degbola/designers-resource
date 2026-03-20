import { NextRequest, NextResponse } from 'next/server'
import { generateWithAI, getAvailableProviders, type AIProvider, type AIMode } from '@/lib/ai-providers'

export const maxDuration = 60

export async function GET() {
  const providers = getAvailableProviders()
  return NextResponse.json({ available: Object.values(providers).some(Boolean), providers })
}

export async function POST(req: NextRequest) {
  const providers = getAvailableProviders()
  const { prompt, industry, moods, targetAudience, provider = 'claude', mode = 'quality' } = await req.json()

  const chosenProvider = provider as AIProvider
  const chosenMode = mode as AIMode

  if (!providers[chosenProvider]) {
    return NextResponse.json({ available: false, error: `${chosenProvider} API key not configured.` })
  }
  if (!prompt?.trim()) return NextResponse.json({ available: true, error: 'No prompt provided' })

  const extras = [
    industry && `Industry: ${industry}`,
    moods?.length && `Desired mood/vibe: ${moods.join(', ')}`,
    targetAudience && `Target audience: ${targetAudience}`,
  ].filter(Boolean).join('\n')

  const systemPrompt = `You are a senior brand strategist and creative director with 20 years of experience building iconic brands. Generate a complete, richly detailed brand from the user's idea. Write like a professional brand deck — vivid, specific, evocative. Every description should paint a picture, not just state a fact. Avoid generic filler at all costs.`

  const userPrompt = `Generate a complete brand for this idea: "${prompt}"
${extras ? `\nAdditional context:\n${extras}` : ''}

Respond with ONLY valid JSON — no markdown, no extra text:
{
  "brand": {
    "name": "Creative brand name",
    "tagline": "Memorable tagline",
    "industry": "Industry/sector",
    "concept": "2-3 sentence brand concept describing what it is and what makes it compelling"
  },
  "strategy": {
    "mission": "Clear mission statement — what the brand does and why it exists",
    "vision": "Inspiring vision — where the brand is headed long-term",
    "values": ["Value 1", "Value 2", "Value 3", "Value 4"],
    "positioning": "How the brand is positioned relative to the market",
    "personality": "3-5 strong adjectives as the primary format — these are essential and must come first (e.g. 'Bold, Precise, Warm, Trustworthy, Ambitious'). Optionally follow with a single brief phrase that captures the overall character (e.g. 'Bold, Precise, Warm — the kind of confidence that earns trust quietly'). The adjectives are non-negotiable.",
    "toneOfVoice": "2-3 sentences describing how the brand sounds — the register, rhythm, vocabulary it uses, what it avoids, and 1-2 example phrases that sound like the brand",
    "targetAudience": "A rich 3-4 sentence portrait of the ideal customer — their age range, profession, mindset, aspirations, daily life, what they care about, and what they're tired of from existing options",
    "competitors": ["Real brand name + 1 sentence on why it's a competitor or point of comparison", "Competitor 2 + context", "Competitor 3 + context"],
    "differentiators": ["A specific, concrete differentiator — not vague like 'better UX' but what exactly sets it apart", "Differentiator 2", "Differentiator 3"],
    "brandStory": "3-4 sentences — a compelling founding narrative with a clear problem, a moment of insight or frustration, and why this brand had to exist. Make it feel real and human."
  },
  "visualIdentity": {
    "paletteOptions": [
      { "name": "Option 1 palette name", "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"], "rationale": "Why this palette fits the brand" },
      { "name": "Option 2 palette name", "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"], "rationale": "A different direction — warmer/cooler/bolder/more muted" },
      { "name": "Option 3 palette name", "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"], "rationale": "A third distinct take on the brand's colour story" }
    ],
    "typographyOptions": [
      { "heading": "Google Font name", "body": "Google Font name", "headingWeight": 700, "bodyWeight": 400, "rationale": "Why this pairing fits the brand" },
      { "heading": "Google Font name", "body": "Google Font name", "headingWeight": 600, "bodyWeight": 300, "rationale": "A different typographic direction — different feel, different contrast" },
      { "heading": "Google Font name", "body": "Google Font name", "headingWeight": 700, "bodyWeight": 400, "rationale": "A third option with distinct personality" }
    ],
    "logoDirection": "2-3 sentences describing the logo concept — the symbol or mark idea and what it represents, the wordmark style, weight and form, and how they work together. Be specific enough that a designer could begin sketching.",
    "imageryStyle": "2-3 sentences describing the visual world of the brand — photography or illustration style, lighting, colour grading, the kinds of subjects and scenes, composition approach, and the overall feeling someone gets when they see it.",
    "designPrinciples": ["A actionable design principle stated as a directive — e.g. 'Breathe: generous whitespace signals confidence, never fill for the sake of filling'", "Principle 2 with rationale", "Principle 3 with rationale"],
    "moodboardKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"]
  }
}

Rules:
- Brand name must be original and fitting
- All hex colors must be valid 6-digit hex codes starting with #
- Font weights must be standard values: 300, 400, 500, 600, 700, 800, 900
- Be specific and creative — no generic placeholder text
- All sections must feel cohesive and aligned with the brand concept
- Typography: Industry rules are STRICT — fintech, SaaS, tech, and financial brands must use sans-serif fonts only (no serif, no display, no slab — this includes DM Serif Display, Playfair Display, and any other serif or display face). Luxury, fashion, editorial → refined serif or elegant display. Food, wellness, handmade → warm humanist or handwritten. Legal, consultancy → authoritative serif or slab. Generate 3 DISTINCT typographyOptions — each must feel meaningfully different (different weight contrast, different character, different era or energy) while all remaining appropriate for the industry. Do not repeat the same fonts across options.
- Colors: Generate 3 DISTINCT paletteOptions — each must be a genuinely different colour direction (e.g. one bold and high-contrast, one muted and refined, one warm-toned) while all feeling appropriate for the brand. Each should have its own name and rationale. Do not use the same hues across options.`

  try {
    const raw = await generateWithAI(systemPrompt, userPrompt, chosenProvider, chosenMode, 5500)
    // Extract JSON by matching braces — handles models that append reasoning text after the JSON
    const start = raw.indexOf('{')
    if (start === -1) throw new Error('No JSON object found in response')
    let depth = 0, end = -1
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === '{') depth++
      else if (raw[i] === '}') { depth--; if (depth === 0) { end = i; break } }
    }
    if (end === -1) throw new Error('Unclosed JSON object in response')
    const cleaned = raw.slice(start, end + 1)
    const result = JSON.parse(cleaned)
    return NextResponse.json({ available: true, result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Brand generation failed:', msg)
    return NextResponse.json({ available: true, error: `Brand generation failed: ${msg}` })
  }
}
