export interface BrandStrategy {
  brandName: string
  mission: string
  vision: string
  values: string[]
  positioning: string
  personality: string
  toneOfVoice: string
  targetAudience: string
  competitors: string[]
  differentiators: string[]
  brandStory: string
  tagline: string
  industry: string
}

// Use [\s\S] instead of . with s flag for cross-line matching (TS es2017 compat)
const SECTION_PATTERNS: { key: keyof BrandStrategy; patterns: RegExp[] }[] = [
  {
    key: 'brandName',
    patterns: [
      /(?:brand\s*name|company\s*name|business\s*name|name\s*of\s*(?:the\s*)?(?:brand|company|business))[:\-\s]*["""']?(.+?)["""']?\s*(?:\n|$)/i,
      /(?:^|\n)\s*(?:brand|company)\s*[:\-]\s*(.+?)(?:\n|$)/i,
    ],
  },
  {
    key: 'mission',
    patterns: [
      /(?:mission\s*(?:statement)?)[:\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|vision|values|positioning|personality|tone|target|competitor|differentiator|brand\s*story|tagline|industry|$))/i,
      /(?:what\s*is\s*(?:the|your)\s*(?:brand'?s?\s*)?mission)[:\?\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|$))/i,
    ],
  },
  {
    key: 'vision',
    patterns: [
      /(?:vision\s*(?:statement)?)[:\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|mission|values|positioning|personality|tone|target|competitor|differentiator|brand\s*story|tagline|industry|$))/i,
      /(?:what\s*is\s*(?:the|your)\s*(?:brand'?s?\s*)?vision)[:\?\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|$))/i,
    ],
  },
  {
    key: 'positioning',
    patterns: [
      /(?:(?:brand\s*)?positioning\s*(?:statement)?)[:\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|mission|vision|values|personality|tone|target|competitor|differentiator|brand\s*story|tagline|industry|$))/i,
      /(?:how\s*(?:do\s*you|does\s*the\s*brand)\s*position)[:\?\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|$))/i,
    ],
  },
  {
    key: 'personality',
    patterns: [
      /(?:(?:brand\s*)?personality)[:\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|mission|vision|values|positioning|tone|target|competitor|differentiator|brand\s*story|tagline|industry|$))/i,
      /(?:(?:describe|what\s*is)\s*(?:the|your)\s*(?:brand'?s?\s*)?personality)[:\?\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|$))/i,
    ],
  },
  {
    key: 'toneOfVoice',
    patterns: [
      /(?:tone\s*(?:of\s*voice|&\s*voice)?|(?:brand\s*)?voice)[:\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|mission|vision|values|positioning|personality|target|competitor|differentiator|brand\s*story|tagline|industry|$))/i,
      /(?:how\s*(?:does|should)\s*the\s*brand\s*(?:sound|communicate|speak))[:\?\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|$))/i,
    ],
  },
  {
    key: 'targetAudience',
    patterns: [
      /(?:target\s*(?:audience|market|demographic|customer)|ideal\s*(?:customer|client))[:\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|mission|vision|values|positioning|personality|tone|competitor|differentiator|brand\s*story|tagline|industry|$))/i,
      /(?:who\s*(?:is|are)\s*(?:the|your)\s*(?:target|ideal)\s*(?:audience|customer|client))[:\?\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|$))/i,
    ],
  },
  {
    key: 'brandStory',
    patterns: [
      /(?:(?:brand\s*)?story|(?:brand\s*)?narrative|(?:brand\s*)?origin|about\s*(?:the\s*)?(?:brand|company))[:\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|mission|vision|values|positioning|personality|tone|target|competitor|differentiator|tagline|industry|$))/i,
      /(?:(?:tell|share|what\s*is)\s*(?:the|your)\s*(?:brand'?s?\s*)?story)[:\?\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|$))/i,
    ],
  },
  {
    key: 'tagline',
    patterns: [
      /(?:tagline|slogan|motto|catchphrase)[:\-\s]*["""']?(.+?)["""']?\s*(?:\n|$)/i,
    ],
  },
  {
    key: 'industry',
    patterns: [
      /(?:industry|sector|field|niche|market\s*(?:segment)?)[:\-\s]*(.+?)(?:\n|$)/i,
    ],
  },
]

const LIST_SECTION_PATTERNS: { key: 'values' | 'competitors' | 'differentiators'; patterns: RegExp[] }[] = [
  {
    key: 'values',
    patterns: [
      /(?:(?:core\s*)?values|(?:brand\s*)?values|principles)[:\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|mission|vision|positioning|personality|tone|target|competitor|differentiator|brand\s*story|tagline|industry|$))/i,
      /(?:what\s*(?:are|do)\s*(?:the|your)\s*(?:brand'?s?\s*)?(?:core\s*)?values)[:\?\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|$))/i,
    ],
  },
  {
    key: 'competitors',
    patterns: [
      /(?:competitor[s]?|competition|competitive\s*landscape|rival[s]?)[:\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|mission|vision|values|positioning|personality|tone|target|differentiator|brand\s*story|tagline|industry|$))/i,
    ],
  },
  {
    key: 'differentiators',
    patterns: [
      /(?:differentiator[s]?|(?:unique\s*)?(?:selling\s*)?(?:point|proposition)[s]?|USP|what\s*(?:makes|sets)\s*(?:you|the\s*brand)\s*(?:different|apart|unique))[:\-\s]*([\s\S]+?)(?=\n\s*(?:[A-Z][\w\s]*:|mission|vision|values|positioning|personality|tone|target|competitor|brand\s*story|tagline|industry|$))/i,
    ],
  },
]

function parseListValue(raw: string): string[] {
  const items = raw
    .split(/[\n,;]|(?:[-•·]\s)|\d+[.)]\s/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length < 200)

  return items.slice(0, 10)
}

export function parseStrategyQuestionnaire(text: string): BrandStrategy {
  const strategy: BrandStrategy = {
    brandName: '',
    mission: '',
    vision: '',
    values: [],
    positioning: '',
    personality: '',
    toneOfVoice: '',
    targetAudience: '',
    competitors: [],
    differentiators: [],
    brandStory: '',
    tagline: '',
    industry: '',
  }

  // Parse string sections
  for (const { key, patterns } of SECTION_PATTERNS) {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const value = match[1].trim()
        if (value.length > 0) {
          ;(strategy as unknown as Record<string, unknown>)[key] = value
          break
        }
      }
    }
  }

  // Parse list sections
  for (const { key, patterns } of LIST_SECTION_PATTERNS) {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        strategy[key] = parseListValue(match[1])
        break
      }
    }
  }

  // Clean up multi-line values
  for (const key of ['mission', 'vision', 'positioning', 'personality', 'toneOfVoice', 'targetAudience', 'brandStory'] as const) {
    if (strategy[key]) {
      strategy[key] = strategy[key].replace(/\s+/g, ' ').trim()
    }
  }

  return strategy
}

export function isStrategyEmpty(strategy: BrandStrategy): boolean {
  return (
    !strategy.brandName &&
    !strategy.mission &&
    !strategy.vision &&
    strategy.values.length === 0 &&
    !strategy.positioning &&
    !strategy.personality &&
    !strategy.toneOfVoice &&
    !strategy.targetAudience &&
    !strategy.brandStory &&
    !strategy.tagline
  )
}

// Strategy section metadata for display
export const STRATEGY_SECTIONS = [
  { key: 'mission' as const, label: 'Mission', icon: 'Target' },
  { key: 'vision' as const, label: 'Vision', icon: 'Eye' },
  { key: 'values' as const, label: 'Core Values', icon: 'Heart', isList: true },
  { key: 'positioning' as const, label: 'Positioning', icon: 'Crosshair' },
  { key: 'personality' as const, label: 'Brand Personality', icon: 'Smile' },
  { key: 'toneOfVoice' as const, label: 'Tone of Voice', icon: 'MessageCircle' },
  { key: 'targetAudience' as const, label: 'Target Audience', icon: 'Users' },
  { key: 'competitors' as const, label: 'Competitors', icon: 'Swords', isList: true },
  { key: 'differentiators' as const, label: 'Differentiators', icon: 'Star', isList: true },
  { key: 'brandStory' as const, label: 'Brand Story', icon: 'BookOpen' },
  { key: 'tagline' as const, label: 'Tagline', icon: 'Quote' },
]
