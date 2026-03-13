'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import {
  ArrowLeft, Sparkles, Copy, Check, Loader2, Zap, ClipboardPaste, PenLine,
  Target, Eye, Heart, Crosshair, Smile, MessageCircle, Users, Swords, Star,
  BookOpen, Quote, ArrowRight, FileText,
} from 'lucide-react'
import Link from 'next/link'
import { analyzeBrief } from '@/lib/brief-engine'
import type { BriefInput, BriefResult, PaletteSuggestion, FontSuggestion } from '@/lib/brief-engine'
import { parseStrategyQuestionnaire, isStrategyEmpty, STRATEGY_SECTIONS } from '@/lib/brand-strategy'
import type { BrandStrategy } from '@/lib/brand-strategy'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Target, Eye, Heart, Crosshair, Smile, MessageCircle, Users, Swords, Star, BookOpen, Quote,
}

const INDUSTRIES = [
  { value: 'tech', label: 'Technology' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'realestate', label: 'Real Estate' },
  { value: 'creative', label: 'Creative Agency' },
  { value: 'beauty', label: 'Beauty & Cosmetics' },
  { value: 'sports', label: 'Sports & Fitness' },
  { value: 'nonprofit', label: 'Nonprofit' },
]

const MOODS = [
  'bold', 'minimal', 'playful', 'elegant', 'professional',
  'energetic', 'calm', 'luxury', 'warm', 'cool', 'retro', 'futuristic',
]

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  tech: ['tech', 'technology', 'software', 'app', 'saas', 'startup', 'digital', 'ai', 'platform'],
  fashion: ['fashion', 'clothing', 'apparel', 'wear', 'style', 'boutique', 'garment'],
  food: ['food', 'restaurant', 'cafe', 'coffee', 'bakery', 'catering', 'beverage', 'drink', 'bar', 'kitchen'],
  health: ['health', 'wellness', 'medical', 'clinic', 'therapy', 'yoga', 'meditation', 'mental health', 'healthcare'],
  finance: ['finance', 'bank', 'investment', 'fintech', 'insurance', 'accounting', 'wealth', 'trading'],
  education: ['education', 'school', 'university', 'learning', 'course', 'academy', 'training', 'edtech'],
  entertainment: ['entertainment', 'music', 'gaming', 'media', 'film', 'event', 'concert', 'streaming'],
  realestate: ['real estate', 'property', 'housing', 'realty', 'apartment', 'home', 'construction', 'architecture'],
  creative: ['creative', 'design', 'agency', 'studio', 'branding', 'marketing', 'advertising', 'art'],
  beauty: ['beauty', 'cosmetics', 'skincare', 'makeup', 'salon', 'spa', 'hair', 'nail'],
  sports: ['sports', 'fitness', 'gym', 'athletic', 'workout', 'training', 'outdoor', 'running'],
  nonprofit: ['nonprofit', 'charity', 'foundation', 'ngo', 'volunteer', 'community', 'social impact', 'donation'],
}

const MOOD_KEYWORDS: Record<string, string[]> = {
  bold: ['bold', 'strong', 'powerful', 'confident', 'impactful', 'daring'],
  minimal: ['minimal', 'minimalist', 'simple', 'clean', 'understated'],
  playful: ['playful', 'fun', 'whimsical', 'cheerful', 'vibrant', 'lively'],
  elegant: ['elegant', 'refined', 'sophisticated', 'graceful', 'tasteful'],
  professional: ['professional', 'corporate', 'formal', 'trustworthy', 'reliable'],
  energetic: ['energetic', 'dynamic', 'active', 'exciting', 'spirited'],
  calm: ['calm', 'peaceful', 'serene', 'tranquil', 'soothing', 'relaxing'],
  luxury: ['luxury', 'premium', 'exclusive', 'high-end', 'upscale', 'luxurious'],
  warm: ['warm', 'friendly', 'welcoming', 'approachable', 'cozy', 'inviting'],
  cool: ['cool', 'sleek', 'modern', 'contemporary', 'crisp', 'edgy'],
  retro: ['retro', 'vintage', 'nostalgic', 'classic', 'throwback'],
  futuristic: ['futuristic', 'innovative', 'cutting-edge', 'forward', 'next-gen'],
}

function parseBriefText(text: string): BriefInput {
  const lower = text.toLowerCase()
  let bestIndustry = 'creative'
  let bestScore = 0
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw)).length
    if (score > bestScore) { bestScore = score; bestIndustry = industry }
  }
  const detectedMoods = MOODS.filter(mood => lower.includes(mood))
  let brandName = ''
  const namePatterns = [
    /(?:brand|company|business|called|named|for)\s*(?:name)?[:\-]?\s*["']?([A-Z][A-Za-z0-9\s&.]+?)["']?(?:\.|,|\n|$)/,
    /^["']?([A-Z][A-Za-z0-9\s&.]{1,30})["']?\s*(?:is|—|-|–|:)/m,
  ]
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match) { brandName = match[1].trim(); break }
  }
  let targetAudience = ''
  const audiencePatterns = [
    /(?:target\s*audience|aimed\s*at|targeting|designed\s*for|cater(?:s|ing)?\s*to|audience)[:\-]?\s*(.+?)(?:\.|;|\n|$)/i,
    /(?:for|serving)\s+([\w\s,\-]+(?:age[sd]?\s*\d[\d\s\-–to]+|\d+[\s\-–to]+\d+)[\w\s,]*)/i,
  ]
  for (const pattern of audiencePatterns) {
    const match = text.match(pattern)
    if (match) { targetAudience = match[1].trim().slice(0, 100); break }
  }
  const colorMatches = text.match(/#[0-9a-fA-F]{6}\b/g)
  const brandColors = colorMatches ? [...new Set(colorMatches.slice(0, 5))] : []
  return { brandName, industry: bestIndustry, moods: detectedMoods, targetAudience, description: text.slice(0, 500), brandColors }
}

function getLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const rgb = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  const vals = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) })
  return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2]
}

function textColorForBg(hex: string): string {
  return getLuminance(hex) > 0.4 ? '#000000' : '#ffffff'
}

function loadGoogleFont(fontName: string, weight: number) {
  const id = `font-${fontName.replace(/\s+/g, '-')}-${weight}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@${weight}&display=swap`
  document.head.appendChild(link)
}

function PaletteDisplay({ palettes }: { palettes: PaletteSuggestion[] }) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color)
    setCopiedColor(color)
    setTimeout(() => setCopiedColor(null), 1500)
  }
  return (
    <div className="space-y-6">
      {palettes.map((palette, i) => (
        <div key={i}>
          <h4 className="text-sm font-semibold text-dark-100 mb-1">{palette.name}</h4>
          <p className="text-xs text-dark-400 mb-3">{palette.rationale}</p>
          <div className="flex gap-2 h-20">
            {palette.colors.map((color, j) => (
              <button key={j} onClick={() => copyColor(color)}
                className="flex-1 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: color, color: textColorForBg(color) }}>
                <span className="font-mono text-xs font-bold">{color.toUpperCase()}</span>
                <span className="text-[10px] opacity-70">{copiedColor === color ? 'Copied!' : 'Click to copy'}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FontDisplay({ fonts }: { fonts: FontSuggestion[] }) {
  useEffect(() => { fonts.forEach((f) => { loadGoogleFont(f.heading, f.headingWeight); loadGoogleFont(f.body, f.bodyWeight) }) }, [fonts])
  return (
    <div className="space-y-4">
      {fonts.map((font, i) => (
        <Card key={i} className="!glass">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-white/30 text-dark-300 px-2 py-0.5 rounded">{font.category}</span>
          </div>
          <div className="bg-white/40 rounded-lg p-4 mb-3">
            <h3 className="text-2xl text-dark-100 mb-2" style={{ fontFamily: `'${font.heading}', serif`, fontWeight: font.headingWeight }}>{font.heading}</h3>
            <p className="text-sm text-dark-300 leading-relaxed" style={{ fontFamily: `'${font.body}', sans-serif`, fontWeight: font.bodyWeight }}>
              Great design speaks to the heart of your audience. This pairing brings clarity and character to every touchpoint.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs mb-2">
            <div><p className="text-dark-400">Heading: <span className="text-dark-100">{font.heading}</span> ({font.headingWeight})</p></div>
            <div><p className="text-dark-400">Body: <span className="text-dark-100">{font.body}</span> ({font.bodyWeight})</p></div>
          </div>
          <p className="text-xs text-dark-400">{font.rationale}</p>
        </Card>
      ))}
    </div>
  )
}

// -- Strategy Display --
function StrategyDisplay({ strategy, onUseInBrief }: { strategy: BrandStrategy; onUseInBrief: () => void }) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const copyAll = () => {
    const lines: string[] = []
    if (strategy.brandName) lines.push(`Brand Name: ${strategy.brandName}`)
    if (strategy.industry) lines.push(`Industry: ${strategy.industry}`)
    if (strategy.tagline) lines.push(`Tagline: ${strategy.tagline}`)
    for (const section of STRATEGY_SECTIONS) {
      const value = strategy[section.key]
      if (!value || (Array.isArray(value) && value.length === 0)) continue
      if (Array.isArray(value)) {
        lines.push(`\n${section.label}:\n${value.map(v => `  - ${v}`).join('\n')}`)
      } else {
        lines.push(`\n${section.label}:\n${value}`)
      }
    }
    navigator.clipboard.writeText(lines.join('\n'))
    setCopiedSection('all')
    setTimeout(() => setCopiedSection(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Header with brand name */}
      <Card className="!glass">
        <div className="flex items-center justify-between mb-2">
          <div>
            {strategy.brandName && (
              <h3 className="text-xl font-bold text-dark-100">{strategy.brandName}</h3>
            )}
            {strategy.industry && (
              <p className="text-sm text-dark-400 capitalize mt-0.5">{strategy.industry}</p>
            )}
            {strategy.tagline && (
              <p className="text-sm text-accent italic mt-1">&ldquo;{strategy.tagline}&rdquo;</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyAll}
              className="flex items-center gap-1 text-xs text-dark-400 hover:text-dark-100 transition-colors cursor-pointer px-2 py-1 rounded bg-white/40"
            >
              {copiedSection === 'all' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy All</>}
            </button>
          </div>
        </div>
      </Card>

      {/* Strategy sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {STRATEGY_SECTIONS.map((section) => {
          const value = strategy[section.key]
          if (!value || (Array.isArray(value) && value.length === 0)) return null
          const IconComponent = ICON_MAP[section.icon]

          return (
            <Card key={section.key} className="!glass !p-4">
              <div className="flex items-center gap-2 mb-2">
                {IconComponent && <IconComponent size={14} className="text-accent" />}
                <h4 className="text-xs font-semibold text-accent uppercase tracking-wider">{section.label}</h4>
              </div>
              {section.isList && Array.isArray(value) ? (
                <ul className="space-y-1">
                  {(value as string[]).map((item, i) => (
                    <li key={i} className="text-sm text-dark-200 flex items-start gap-2">
                      <span className="text-accent mt-1.5 text-[6px]">&#9679;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-dark-200 leading-relaxed">{value as string}</p>
              )}
            </Card>
          )
        })}
      </div>

      {/* Use in Brief button */}
      <Button onClick={onUseInBrief} className="w-full">
        <ArrowRight size={16} /> Use in Visual Identity
      </Button>
    </div>
  )
}

function BrandBuilderInner() {
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<'strategy' | 'brief'>('strategy')

  // Strategy state
  const [strategyText, setStrategyText] = useState('')
  const [strategy, setStrategy] = useState<BrandStrategy | null>(null)

  // Brief state
  const [form, setForm] = useState<BriefInput>(() => {
    const brandName = searchParams?.get('brandName') || ''
    const industry = searchParams?.get('industry') || 'tech'
    const description = searchParams?.get('description') || ''
    const targetAudience = searchParams?.get('targetAudience') || ''
    return { brandName, industry, moods: [], targetAudience, description, brandColors: [] }
  })
  const [colorInput, setColorInput] = useState('#6366f1')
  const [result, setResult] = useState<BriefResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(false)
  const [useAi, setUseAi] = useState(false)
  const [aiUsed, setAiUsed] = useState(false)
  const [inputMode, setInputMode] = useState<'form' | 'paste'>('form')
  const [pastedBrief, setPastedBrief] = useState('')

  useEffect(() => {
    if (searchParams?.get('brandName')) setActiveSection('brief')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch('/api/brief/analyze').then(r => r.json()).then(d => {
      setAiAvailable(d.available)
      if (d.available) setUseAi(true)
    }).catch(() => {})
  }, [])

  // Strategy handlers
  const handleParseStrategy = async () => {
    if (!strategyText.trim()) return
    setLoading(true)
    if (useAi && aiAvailable) {
      try {
        const res = await fetch('/api/brief/strategy', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: strategyText }),
        })
        const data = await res.json()
        if (data.available && data.result && !data.error) {
          setStrategy(data.result)
          setLoading(false)
          return
        }
      } catch {}
    }
    const parsed = parseStrategyQuestionnaire(strategyText)
    setStrategy(parsed)
    setLoading(false)
  }

  const handleUseInBrief = () => {
    if (!strategy) return

    // Detect industry from strategy
    let bestIndustry = 'creative'
    let bestScore = 0
    const searchText = [strategy.industry, strategy.brandStory, strategy.positioning, strategy.mission].join(' ').toLowerCase()
    for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
      const score = keywords.filter(kw => searchText.includes(kw)).length
      if (score > bestScore) { bestScore = score; bestIndustry = industry }
    }

    // Detect moods from strategy personality/tone
    const moodSearchText = [strategy.personality, strategy.toneOfVoice, strategy.positioning].join(' ').toLowerCase()
    const detectedMoods: string[] = []
    for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
      if (keywords.some(kw => moodSearchText.includes(kw))) {
        detectedMoods.push(mood)
      }
    }

    // Build description from strategy
    const descParts = [
      strategy.mission,
      strategy.positioning,
      strategy.brandStory,
    ].filter(Boolean)

    setForm({
      brandName: strategy.brandName || '',
      industry: bestIndustry,
      moods: detectedMoods,
      targetAudience: strategy.targetAudience || '',
      description: descParts.join(' ').slice(0, 500),
      brandColors: [],
    })
    setInputMode('form')
    setActiveSection('brief')
  }

  // Brief handlers
  const toggleMood = (mood: string) => {
    setForm(prev => ({ ...prev, moods: prev.moods.includes(mood) ? prev.moods.filter(m => m !== mood) : [...prev.moods, mood] }))
  }

  const addBrandColor = () => {
    if (colorInput && !form.brandColors?.includes(colorInput)) {
      setForm(prev => ({ ...prev, brandColors: [...(prev.brandColors || []), colorInput] }))
    }
  }

  const removeBrandColor = (color: string) => {
    setForm(prev => ({ ...prev, brandColors: prev.brandColors?.filter(c => c !== color) || [] }))
  }

  const handleParseBrief = () => {
    if (!pastedBrief.trim()) return
    const parsed = parseBriefText(pastedBrief)
    setForm(parsed)
    setInputMode('form')
  }

  const handleAnalyze = async () => {
    if (inputMode === 'paste' && pastedBrief.trim()) {
      const parsed = parseBriefText(pastedBrief)
      setForm(parsed)
    }
    setLoading(true)
    setAiUsed(false)
    const briefToAnalyze = inputMode === 'paste' && pastedBrief.trim() ? parseBriefText(pastedBrief) : form
    const ruleResult = analyzeBrief(briefToAnalyze)
    if (useAi && aiAvailable) {
      try {
        const res = await fetch('/api/brief/analyze', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(briefToAnalyze),
        })
        const data = await res.json()
        if (data.available && data.result && !data.error) {
          setResult(data.result); setAiUsed(true); setLoading(false); return
        }
      } catch {}
    }
    setResult(ruleResult)
    setLoading(false)
  }

  const resultTabs = result ? [
    { id: 'palettes', label: 'Color Palettes', content: <PaletteDisplay palettes={result.palettes} /> },
    { id: 'typography', label: 'Typography', content: <FontDisplay fonts={result.fonts} /> },
  ] : []

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-dark-100 transition-colors">
        <ArrowLeft size={16} /> Back to Tools
      </Link>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-white/40 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveSection('strategy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            activeSection === 'strategy' ? 'bg-accent text-white' : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          <FileText size={15} /> Brand Strategy
        </button>
        <button
          onClick={() => setActiveSection('brief')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            activeSection === 'brief' ? 'bg-accent text-white' : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          <Sparkles size={15} /> Visual Identity
        </button>
      </div>

      {/* ===== BRAND STRATEGY SECTION ===== */}
      {activeSection === 'strategy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
                <FileText size={20} className="text-accent" /> Brand Strategy
              </h3>
              {aiAvailable && (
                <button
                  onClick={() => setUseAi(!useAi)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${useAi ? 'bg-accent/20 text-accent border border-accent/50' : 'bg-white/30 text-dark-400 border border-white/40'}`}
                >
                  <Zap size={12} /> AI Enhanced
                </button>
              )}
            </div>
            <p className="text-sm text-dark-400 mb-4">
              Paste your answered brand strategy questionnaire below.{aiAvailable && useAi ? ' Claude will intelligently extract and enrich your strategy.' : ' The parser will extract mission, vision, values, positioning, personality, tone of voice, and more.'}
            </p>
            <Textarea
              label="Paste answered questionnaire"
              value={strategyText}
              onChange={(e) => setStrategyText(e.target.value)}
              placeholder={`Paste your brand strategy questionnaire answers here...\n\nExample format:\n\nBrand Name: Luxe Beauty\nIndustry: Beauty & Cosmetics\n\nMission: To empower women with premium, sustainably-sourced skincare...\n\nVision: To become the leading clean beauty brand globally...\n\nCore Values:\n- Sustainability\n- Transparency\n- Empowerment\n\nTarget Audience: Women aged 25-45 who prioritize clean beauty...\n\nBrand Personality: Elegant, warm, and trustworthy...\n\nTone of Voice: Confident yet approachable, knowledgeable but never condescending...\n\nPositioning: The premium clean beauty brand for the conscious consumer...\n\nTagline: "Beauty, Consciously Crafted"`}
              className="!min-h-[360px]"
            />
            <Button onClick={handleParseStrategy} disabled={!strategyText.trim() || loading} className="w-full mt-4">
              {loading && activeSection === 'strategy' ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate Strategy</>}
            </Button>
          </Card>

          {/* Output */}
          <div>
            {strategy && !isStrategyEmpty(strategy) ? (
              <StrategyDisplay strategy={strategy} onUseInBrief={handleUseInBrief} />
            ) : (
              <Card className="flex flex-col items-center justify-center py-16 text-center">
                <FileText size={40} className="text-dark-500 mb-4" />
                <h3 className="text-lg font-semibold text-dark-300 mb-2">Brand Strategy</h3>
                <p className="text-sm text-dark-400 max-w-xs">
                  Paste your answered brand strategy questionnaire and click Generate to see a structured brand strategy document.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ===== DESIGN BRIEF SECTION ===== */}
      {activeSection === 'brief' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
                <Sparkles size={20} className="text-accent" /> Visual Identity
              </h3>
              {aiAvailable && (
                <button
                  onClick={() => setUseAi(!useAi)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${useAi ? 'bg-accent/20 text-accent border border-accent/50' : 'bg-white/30 text-dark-400 border border-white/40'}`}
                >
                  <Zap size={12} /> AI Enhanced
                </button>
              )}
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 mb-6 bg-white/40 p-1 rounded-lg">
              <button
                onClick={() => setInputMode('form')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  inputMode === 'form' ? 'bg-white/30 text-dark-100' : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                <PenLine size={13} /> Fill Form
              </button>
              <button
                onClick={() => setInputMode('paste')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  inputMode === 'paste' ? 'bg-white/30 text-dark-100' : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                <ClipboardPaste size={13} /> Paste Brief
              </button>
            </div>

            {inputMode === 'paste' ? (
              <div className="space-y-4">
                <Textarea
                  label="Paste your entire brief"
                  value={pastedBrief}
                  onChange={(e) => setPastedBrief(e.target.value)}
                  placeholder={"Paste your full design brief here...\n\nExample:\nBrand: Luxe Beauty\nIndustry: Beauty & Cosmetics\nTarget audience: Women aged 25-40 who value premium skincare\nMood: Elegant, luxury, minimal\nDescription: A premium skincare brand focused on natural ingredients and sustainable packaging. Brand colors: #2D1B4E, #D4AF37"}
                  className="!min-h-[280px]"
                />
                <p className="text-xs text-dark-400">
                  The parser will auto-detect brand name, industry, mood, target audience, and hex colors from your text.
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleAnalyze} disabled={loading || !pastedBrief.trim()} className="flex-1">
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Sparkles size={16} /> Analyze Brief</>}
                  </Button>
                  <Button variant="secondary" onClick={handleParseBrief} disabled={!pastedBrief.trim()}>
                    <PenLine size={16} /> Review Fields
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Input label="Brand Name" value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} placeholder="e.g. Seysey Studios" />
                <Select label="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} options={INDUSTRIES} />

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">Mood / Vibe</label>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map((mood) => (
                      <button key={mood} onClick={() => toggleMood(mood)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer ${
                          form.moods.includes(mood) ? 'bg-accent/20 text-accent border border-accent/50' : 'bg-white/30 text-dark-300 border border-white/40 hover:border-white/50'
                        }`}>{mood}</button>
                    ))}
                  </div>
                </div>

                <Input label="Target Audience" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} placeholder="e.g. Young professionals, ages 25-35" />

                <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the brand, its values, what makes it unique..." />

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">Brand Colors (optional)</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input type="color" value={colorInput} onChange={(e) => setColorInput(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                    <input type="text" value={colorInput} onChange={(e) => setColorInput(e.target.value)} className="bg-white/40 border border-white/40 rounded px-2 py-1.5 text-sm text-dark-100 font-mono w-24 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                    <Button variant="secondary" size="sm" onClick={addBrandColor}>Add</Button>
                  </div>
                  {form.brandColors && form.brandColors.length > 0 && (
                    <div className="flex gap-2">
                      {form.brandColors.map((color) => (
                        <button key={color} onClick={() => removeBrandColor(color)}
                          className="w-8 h-8 rounded-lg cursor-pointer hover:scale-110 transition-transform relative group"
                          style={{ backgroundColor: color }} title={`${color} - click to remove`}>
                          <span className="absolute inset-0 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: textColorForBg(color) }}>x</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={handleAnalyze} disabled={loading} className="w-full">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Sparkles size={16} /> Analyze Brief</>}
                </Button>
              </div>
            )}
          </Card>

          {/* Results */}
          <div>
            {result ? (
              <div className="space-y-6">
                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-dark-100">Results</h3>
                    {aiUsed && (
                      <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap size={10} /> AI Generated
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-dark-300 leading-relaxed">{result.summary}</p>
                </Card>
                <Card>
                  <Tabs tabs={resultTabs} />
                </Card>
              </div>
            ) : (
              <Card className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles size={40} className="text-dark-500 mb-4" />
                <h3 className="text-lg font-semibold text-dark-300 mb-2">Ready to Analyze</h3>
                <p className="text-sm text-dark-400 max-w-xs">
                  Fill out the brief form and click Analyze to get tailored color palettes and typography suggestions.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BrandBuilderPage() {
  return (
    <Suspense>
      <BrandBuilderInner />
    </Suspense>
  )
}
