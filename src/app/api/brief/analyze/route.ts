import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ available: false })
  }

  const body = await req.json()
  const { brandName, industry, moods, targetAudience, description, brandColors } = body

  const client = new Anthropic({ apiKey })

  const prompt = `You are an expert brand designer. Analyze this design brief and suggest color palettes and typography.

Brief:
- Brand Name: ${brandName || 'Not specified'}
- Industry: ${industry}
- Mood/Vibe: ${moods?.join(', ') || 'Not specified'}
- Target Audience: ${targetAudience || 'Not specified'}
- Description: ${description || 'Not specified'}
${brandColors?.length ? `- Existing Brand Colors: ${brandColors.join(', ')}` : ''}

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "palettes": [
    {
      "name": "Palette name",
      "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
      "rationale": "Brief explanation of why these colors work"
    }
  ],
  "fonts": [
    {
      "heading": "Google Font name for headings",
      "body": "Google Font name for body text",
      "headingWeight": 700,
      "bodyWeight": 400,
      "category": "Style category",
      "rationale": "Brief explanation of why this pairing works"
    }
  ],
  "summary": "Overall design direction summary in 2-3 sentences"
}

Rules:
- Provide exactly 3 palettes with 5 hex colors each
- Provide exactly 3 font pairings using real Google Fonts
- Keep rationales concise (1-2 sentences)
- Colors must be valid hex codes starting with #
- Font weights must be standard values (300, 400, 500, 600, 700)
- If brand colors were provided, incorporate them into the first palette`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const result = JSON.parse(text)

    return NextResponse.json({ available: true, result })
  } catch (e) {
    console.error('AI analysis failed:', e)
    return NextResponse.json({ available: true, error: 'AI analysis failed. Using rule-based suggestions instead.' })
  }
}

export async function GET() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY
  return NextResponse.json({ available: hasKey })
}
