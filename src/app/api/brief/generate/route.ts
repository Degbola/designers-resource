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

  const systemPrompt = `You are an expert brand strategist and creative director. Generate a complete, detailed, fictional brand from the user's idea. Be specific, creative, and realistic — avoid generic filler. Every field should feel intentional and cohesive.`

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
    "personality": "Brand personality traits (3-5 descriptive words/phrases)",
    "toneOfVoice": "How the brand communicates — tone, style, language examples",
    "targetAudience": "Detailed description of the ideal customer",
    "competitors": ["Competitor or comparable brand 1", "Competitor 2", "Competitor 3"],
    "differentiators": ["Key differentiator 1", "Key differentiator 2", "Key differentiator 3"],
    "brandStory": "2-3 sentence compelling origin/narrative story for the brand"
  },
  "visualIdentity": {
    "primaryPalette": {
      "name": "Palette name",
      "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
      "rationale": "Why these colors work for this brand"
    },
    "secondaryPalette": {
      "name": "Palette name",
      "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
      "rationale": "How this secondary palette complements the primary"
    },
    "typography": {
      "heading": "A specific, unexpected Google Font for headings — chosen to reflect this exact brand's personality, era, and industry. Must be distinctive and not a common default.",
      "body": "A Google Font for body text that creates a compelling, intentional pairing with the heading — can be contrasting in style (serif+sans, modern+vintage, etc.)",
      "headingWeight": 700,
      "bodyWeight": 400,
      "rationale": "Why this pairing fits the brand"
    },
    "logoDirection": "Detailed description of logo concept, style, and symbol/wordmark approach",
    "imageryStyle": "Description of photography or illustration style, composition, and mood",
    "designPrinciples": ["Design principle 1", "Design principle 2", "Design principle 3"],
    "moodboardKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"]
  }
}

Rules:
- Brand name must be original and fitting
- All hex colors must be valid 6-digit hex codes starting with #
- Font weights must be standard values: 300, 400, 500, 600, 700, 800, 900
- Be specific and creative — no generic placeholder text
- All sections must feel cohesive and aligned with the brand concept
- Typography: pick fonts that GENUINELY suit this specific brand's personality. Be bold and specific — avoid overused defaults like Playfair Display, Montserrat, Open Sans, Roboto, Lato, Raleway, Nunito, Poppins. Each brand must get a UNIQUE pairing that reflects its exact concept, era, tone, and industry. A luxury brand, a tech startup, a handmade bakery, and a law firm should each get completely different font choices.
- Colors: choose palettes that feel authentic to THIS specific brand — avoid generic combinations. The colors should evoke the brand's personality directly.`

  try {
    const raw = await generateWithAI(systemPrompt, userPrompt, chosenProvider, chosenMode, 2500)
    // Extract the JSON object — find first { and its matching closing }
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('No JSON object found in response')
    const cleaned = raw.slice(start, end + 1)
    const result = JSON.parse(cleaned)
    return NextResponse.json({ available: true, result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Brand generation failed:', msg)
    return NextResponse.json({ available: true, error: `Brand generation failed: ${msg}` })
  }
}
