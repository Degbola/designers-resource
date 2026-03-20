import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

export type AIProvider = 'claude' | 'gemini' | 'chatgpt'
export type AIMode = 'fast' | 'quality'

const MODELS = {
  claude: { fast: 'claude-haiku-4-5-20251001', quality: 'claude-sonnet-4-6' },
  gemini: { fast: 'gemini-2.0-flash',          quality: 'gemini-2.0-flash' },
  chatgpt: { fast: 'gpt-4o-mini',              quality: 'gpt-4o' },
} as const

export function getAvailableProviders() {
  return {
    claude:  !!process.env.ANTHROPIC_API_KEY,
    gemini:  !!process.env.GEMINI_API_KEY,
    chatgpt: false, // add OPENAI_API_KEY to enable
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

  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const geminiModel = genAI.getGenerativeModel({
      model,
      systemInstruction: systemPrompt,
    })
    const result = await geminiModel.generateContent(userPrompt)
    return result.response.text()
  }

  throw new Error(`Unknown or unavailable provider: ${provider}`)
}
