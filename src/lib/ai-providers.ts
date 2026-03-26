import Anthropic from '@anthropic-ai/sdk'

export type AIProvider = 'claude' | 'nvidia' | 'chatgpt'
export type AIMode = 'fast' | 'quality'

const CLAUDE_MODELS  = { fast: 'claude-haiku-4-5-20251001', quality: 'claude-sonnet-4-6' }
const NVIDIA_MODELS  = { fast: 'moonshotai/kimi-k2-instruct', quality: 'moonshotai/kimi-k2-instruct' }
const CHATGPT_MODELS = { fast: 'gpt-4o-mini', quality: 'gpt-4o' }

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

  if (provider === 'claude') {
    const model = CLAUDE_MODELS[mode]
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
    const model = NVIDIA_MODELS[mode]
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
    if (!res.ok) throw new Error(`NVIDIA API error ${res.status}: ${text}`)
    if (!text) throw new Error('NVIDIA API returned empty response')
    const data = JSON.parse(text)
    return data.choices?.[0]?.message?.content ?? ''
  }

if (provider === 'chatgpt') {
    const model = CHATGPT_MODELS[mode]
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
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
    const text = await res.text()
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${text}`)
    const data = JSON.parse(text)
    return data.choices?.[0]?.message?.content ?? ''
  }

  throw new Error(`Unknown or unavailable provider: ${provider}`)
}
