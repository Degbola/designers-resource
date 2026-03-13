import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ available: false })
  }

  const { text } = await req.json()
  if (!text?.trim()) {
    return NextResponse.json({ available: true, error: 'No text provided' })
  }

  const client = new Anthropic({ apiKey })

  const prompt = `You are an expert brand strategist. Extract and structure the brand strategy from the following questionnaire answers. Be thorough — infer and enrich where the answers are vague, but stay true to what was written.

Questionnaire answers:
${text}

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "brandName": "Brand name or empty string",
  "industry": "Industry/sector or empty string",
  "tagline": "Tagline/slogan or empty string",
  "mission": "Mission statement — what the brand does and why it exists",
  "vision": "Vision statement — where the brand is going long-term",
  "values": ["Core value 1", "Core value 2", "Core value 3"],
  "positioning": "How the brand is positioned in the market",
  "personality": "Brand personality traits",
  "toneOfVoice": "How the brand communicates — tone, style, language",
  "targetAudience": "Who the brand serves",
  "competitors": ["Competitor 1", "Competitor 2"],
  "differentiators": ["What makes this brand unique 1", "What makes this brand unique 2"],
  "brandStory": "The brand's origin story or narrative"
}

Rules:
- Return empty string "" for fields not mentioned and not inferable
- Return empty array [] for list fields not mentioned
- Keep values concise but meaningful
- Do not fabricate specific facts (names, numbers) not present in the text
- values, competitors, differentiators must be arrays of strings`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const result = JSON.parse(raw)
    return NextResponse.json({ available: true, result })
  } catch (e) {
    console.error('AI strategy parsing failed:', e)
    return NextResponse.json({ available: true, error: 'AI parsing failed. Using rule-based parsing instead.' })
  }
}
