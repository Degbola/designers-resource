import Anthropic from '@anthropic-ai/sdk'

export type AIProvider = 'claude' | 'openrouter' | 'chatgpt'
export type AIMode = 'fast' | 'quality'

const MODELS = {
  claude:      { fast: 'claude-haiku-4-5-20251001',              quality: 'claude-sonnet-4-6' },
  openrouter:  { fast: 'mistralai/mistral-7b-instruct:free',  quality: 'mistralai/mistral-7b-instruct:free' },
  chatgpt:     { fast: 'gpt-4o-mini',                            quality: 'gpt-4o' },
} as const

export function getAvailableProviders() {
  return {
    claude:     !!process.env.ANTHROPIC_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    chatgpt:    false,
  }
}

export async function generateWithAI(
  systemPrompt: string,
  userPrompt: string,
  provider: AIProvider,
  mode: AIMode,
  maxTokens = 4096,
): Promise<string> {
  const model = MODELS[provider][mode]

  if (provider === 'claude') {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    const block = message.content[0]
    return block.type === 'text' ? block.text : ''
  }

  if (provider === 'openrouter') {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Seysey Studios',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenRouter error ${res.status}: ${err}`)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  }

  throw new Error(`Unknown or unavailable provider: ${provider}`)
}
