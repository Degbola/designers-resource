import Anthropic from '@anthropic-ai/sdk'

export type AIProvider = 'claude' | 'nvidia' | 'chatgpt'
export type AIMode = 'fast' | 'quality'

const MODELS = {
  claude:  { fast: 'claude-haiku-4-5-20251001',      quality: 'claude-sonnet-4-6' },
  nvidia:  { fast: 'moonshotai/kimi-k2-instruct',    quality: 'moonshotai/kimi-k2-instruct' },
  chatgpt: { fast: 'gpt-4o-mini',                    quality: 'gpt-4o' },
} as const

export function getAvailableProviders() {
  return {
    claude:  !!process.env.ANTHROPIC_API_KEY,
    nvidia:  !!process.env.NVIDIA_API_KEY,
    chatgpt: false,
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

  if (provider === 'nvidia') {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
      }),
    })
    const text = await res.text()
    if (!res.ok) {
      throw new Error(`NVIDIA API error ${res.status}: ${text}`)
    }
    if (!text) throw new Error('NVIDIA API returned empty response')
    const data = JSON.parse(text)
    return data.choices?.[0]?.message?.content ?? ''
  }

  throw new Error(`Unknown or unavailable provider: ${provider}`)
}
