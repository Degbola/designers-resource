import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  return NextResponse.json({ available: !!process.env.ANTHROPIC_API_KEY })
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ available: false })

  const { prompt, industry, moods, targetAudience } = await req.json()
  if (!prompt?.trim()) return NextResponse.json({ available: true, error: 'No prompt provided' })

  const client = new Anthropic({ apiKey })

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
      "heading": "Real Google Font name for headings",
      "body": "Real Google Font name for body text",
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
- Google Font names must be real, currently available fonts
- Font weights must be standard values: 300, 400, 500, 600, 700, 800, 900
- Be specific and creative — no generic placeholder text
- All sections must feel cohesive and aligned with the brand concept`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
    const result = JSON.parse(cleaned)
    return NextResponse.json({ available: true, result })
  } catch (e) {
    console.error('Brand generation failed:', e)
    return NextResponse.json({ available: true, error: 'Brand generation failed. Please try again.' })
  }
}
