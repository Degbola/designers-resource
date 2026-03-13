'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import {
  ArrowLeft, Wand2, Loader2, ChevronDown, ChevronUp, Copy, Check,
  Target, Eye, Heart, Crosshair, Smile, MessageCircle, Users, Swords,
  Star, BookOpen, RefreshCw, Sparkles, Palette, Type, ImageIcon, Layers,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { STRATEGY_SECTIONS } from '@/lib/brand-strategy'

// ---- Types ----
interface GeneratedBrand {
  brand: {
    name: string
    tagline: string
    industry: string
    concept: string
  }
  strategy: {
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
  }
  visualIdentity: {
    primaryPalette: { name: string; colors: string[]; rationale: string }
    secondaryPalette: { name: string; colors: string[]; rationale: string }
    typography: { heading: string; body: string; headingWeight: number; bodyWeight: number; rationale: string }
    logoDirection: string
    imageryStyle: string
    designPrinciples: string[]
    moodboardKeywords: string[]
  }
}

// ---- Constants ----
const INDUSTRIES = [
  { value: '', label: 'Auto-detect' },
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

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Target, Eye, Heart, Crosshair, Smile, MessageCircle, Users, Swords, Star, BookOpen,
}

// ---- Helpers ----
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
  link.id = id; link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@${weight}&display=swap`
  document.head.appendChild(link)
}

// ---- Sub-components ----
function PaletteBlock({ palette }: { palette: { name: string; colors: string[]; rationale: string } }) {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (color: string) => {
    navigator.clipboard.writeText(color)
    setCopied(color)
    setTimeout(() => setCopied(null), 1500)
  }
  return (
    <div>
      <h4 className="text-sm font-semibold text-dark-100 mb-1">{palette.name}</h4>
      <p className="text-xs text-dark-400 mb-3">{palette.rationale}</p>
      <div className="flex gap-2 h-20">
        {palette.colors.map((color, i) => (
          <button key={i} onClick={() => copy(color)}
            className="flex-1 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-105 transition-transform"
            style={{ backgroundColor: color, color: textColorForBg(color) }}>
            <span className="font-mono text-xs font-bold">{color.toUpperCase()}</span>
            <span className="text-[10px] opacity-70">{copied === color ? 'Copied!' : 'Click to copy'}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function TypographyBlock({ typography }: { typography: GeneratedBrand['visualIdentity']['typography'] }) {
  useEffect(() => {
    loadGoogleFont(typography.heading, typography.headingWeight)
    loadGoogleFont(typography.body, typography.bodyWeight)
  }, [typography])

  return (
    <Card className="!glass">
      <div className="bg-white/40 rounded-lg p-4 mb-3">
        <h3 className="text-2xl text-dark-100 mb-2" style={{ fontFamily: `'${typography.heading}', serif`, fontWeight: typography.headingWeight }}>
          {typography.heading}
        </h3>
        <p className="text-sm text-dark-300 leading-relaxed" style={{ fontFamily: `'${typography.body}', sans-serif`, fontWeight: typography.bodyWeight }}>
          Great design speaks before words do. This pairing brings clarity and character to every brand touchpoint.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs mb-2">
        <div><p className="text-dark-400">Heading: <span className="text-dark-100">{typography.heading}</span> ({typography.headingWeight})</p></div>
        <div><p className="text-dark-400">Body: <span className="text-dark-100">{typography.body}</span> ({typography.bodyWeight})</p></div>
      </div>
      <p className="text-xs text-dark-400">{typography.rationale}</p>
    </Card>
  )
}

// ---- Main Page ----
export default function BrandGeneratorPage() {
  const router = useRouter()
  const resultsRef = useRef<HTMLDivElement>(null)

  const [aiAvailable, setAiAvailable] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [industry, setIndustry] = useState('')
  const [moods, setMoods] = useState<string[]>([])
  const [targetAudience, setTargetAudience] = useState('')
  const [showRefine, setShowRefine] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<GeneratedBrand | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/brief/generate').then(r => r.json()).then(d => setAiAvailable(d.available)).catch(() => {})
  }, [])

  const toggleMood = (mood: string) => {
    setMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood])
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/brief/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, industry: industry || undefined, moods: moods.length ? moods : undefined, targetAudience: targetAudience || undefined }),
      })
      const data = await res.json()
      if (!data.available) { setError('AI is not configured. Please add your Anthropic API key.'); return }
      if (data.error) { setError(data.error); return }
      setResult(data.result)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError('')
    setPrompt('')
    setMoods([])
    setIndustry('')
    setTargetAudience('')
  }

  const handleUseInBrief = () => {
    if (!result) return
    const params = new URLSearchParams({
      brandName: result.brand.name,
      industry: result.brand.industry,
      moods: result.strategy.personality,
      targetAudience: result.strategy.targetAudience,
      description: [result.strategy.mission, result.strategy.positioning].join(' '),
    })
    router.push(`/tools/brief?${params.toString()}`)
  }

  const handleCopyAll = () => {
    if (!result) return
    const lines = [
      `# ${result.brand.name}`,
      `"${result.brand.tagline}"`,
      `Industry: ${result.brand.industry}`,
      `\n## Concept\n${result.brand.concept}`,
      `\n## Strategy`,
      `Mission: ${result.strategy.mission}`,
      `Vision: ${result.strategy.vision}`,
      `Values: ${result.strategy.values.join(', ')}`,
      `Positioning: ${result.strategy.positioning}`,
      `Personality: ${result.strategy.personality}`,
      `Tone of Voice: ${result.strategy.toneOfVoice}`,
      `Target Audience: ${result.strategy.targetAudience}`,
      `Competitors: ${result.strategy.competitors.join(', ')}`,
      `Differentiators: ${result.strategy.differentiators.join(', ')}`,
      `Brand Story: ${result.strategy.brandStory}`,
      `\n## Visual Identity`,
      `Primary Palette: ${result.visualIdentity.primaryPalette.colors.join(', ')}`,
      `Secondary Palette: ${result.visualIdentity.secondaryPalette.colors.join(', ')}`,
      `Typography: ${result.visualIdentity.typography.heading} (headings) + ${result.visualIdentity.typography.body} (body)`,
      `Logo Direction: ${result.visualIdentity.logoDirection}`,
      `Imagery Style: ${result.visualIdentity.imageryStyle}`,
      `Design Principles: ${result.visualIdentity.designPrinciples.join(', ')}`,
      `Moodboard: ${result.visualIdentity.moodboardKeywords.join(', ')}`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-dark-100 transition-colors">
        <ArrowLeft size={16} /> Back to Tools
      </Link>

      {/* Input Card */}
      <Card>
        <h3 className="text-lg font-semibold text-dark-100 flex items-center gap-2 mb-1">
          <Wand2 size={20} className="text-accent" /> Brand Generator
        </h3>
        <p className="text-sm text-dark-400 mb-4">Describe your brand idea and Claude will generate a complete brand — name, strategy, and visual identity.</p>

        <Textarea
          label="Your brand idea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. a sustainable coffee brand for remote workers who value slow mornings and mindful productivity"
          className="!min-h-[100px]"
        />

        <button
          onClick={() => setShowRefine(!showRefine)}
          className="flex items-center gap-1.5 text-sm text-dark-400 hover:text-dark-200 transition-colors mt-3 cursor-pointer"
        >
          {showRefine ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {showRefine ? 'Hide details' : 'Refine with details (optional)'}
        </button>

        {showRefine && (
          <div className="mt-4 space-y-4 border-t border-white/20 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} options={INDUSTRIES} />
              <Input label="Target Audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g. Gen Z creatives, ages 18-28" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Mood / Vibe</label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((mood) => (
                  <button key={mood} onClick={() => toggleMood(mood)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer ${
                      moods.includes(mood) ? 'bg-accent/20 text-accent border border-accent/50' : 'bg-white/30 text-dark-300 border border-white/40 hover:border-white/50'
                    }`}>
                    {mood}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {!aiAvailable && (
          <p className="text-xs text-amber-400 mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            AI not configured. Add your Anthropic API key to use Brand Generator.
          </p>
        )}

        {error && (
          <p className="text-xs text-red-400 mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 mt-4">
          <Button onClick={handleGenerate} disabled={!prompt.trim() || loading || !aiAvailable} className="flex-1">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Generating brand...</> : <><Wand2 size={16} /> Generate Brand</>}
          </Button>
          {result && (
            <Button variant="secondary" onClick={handleReset}>
              <RefreshCw size={16} /> New
            </Button>
          )}
        </div>
      </Card>

      {/* Results */}
      {result && (
        <div ref={resultsRef} className="space-y-6">

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-dark-300">Generated Brand</h3>
            <button onClick={handleCopyAll} className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-dark-100 transition-colors cursor-pointer px-3 py-1.5 rounded-lg bg-white/30 border border-white/40">
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy All</>}
            </button>
          </div>

          {/* 1. Brand Identity */}
          <Card>
            <h3 className="text-lg font-semibold text-dark-100 flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-accent" /> Brand Identity
            </h3>
            <h2 className="text-3xl font-bold text-dark-100 mb-1">{result.brand.name}</h2>
            <p className="text-base text-accent italic mb-3">&ldquo;{result.brand.tagline}&rdquo;</p>
            <span className="text-xs bg-white/30 text-dark-300 px-2.5 py-1 rounded-full capitalize">{result.brand.industry}</span>
            <p className="text-sm text-dark-200 leading-relaxed mt-4">{result.brand.concept}</p>
          </Card>

          {/* 2. Brand Strategy */}
          <Card>
            <h3 className="text-lg font-semibold text-dark-100 flex items-center gap-2 mb-4">
              <Target size={20} className="text-accent" /> Brand Strategy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {STRATEGY_SECTIONS.map((section) => {
                const value = (result.strategy as Record<string, unknown>)[section.key]
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
                            <span className="text-accent mt-1.5 text-[6px]">&#9679;</span>{item}
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
            <Button onClick={handleUseInBrief} className="w-full">
              <Sparkles size={16} /> Use in Visual Identity
            </Button>
          </Card>

          {/* 3. Visual Identity Guide */}
          <Card>
            <h3 className="text-lg font-semibold text-dark-100 flex items-center gap-2 mb-5">
              <Palette size={20} className="text-accent" /> Visual Identity Guide
            </h3>

            <div className="space-y-6">
              {/* Color Palettes */}
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">Color Palettes</p>
                <div className="space-y-5">
                  <PaletteBlock palette={result.visualIdentity.primaryPalette} />
                  <PaletteBlock palette={result.visualIdentity.secondaryPalette} />
                </div>
              </div>

              {/* Typography */}
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">Typography</p>
                <TypographyBlock typography={result.visualIdentity.typography} />
              </div>

              {/* Logo Direction */}
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Logo Direction</p>
                <p className="text-sm text-dark-200 leading-relaxed bg-white/30 rounded-lg p-3">{result.visualIdentity.logoDirection}</p>
              </div>

              {/* Imagery Style */}
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Imagery Style</p>
                <p className="text-sm text-dark-200 leading-relaxed bg-white/30 rounded-lg p-3">{result.visualIdentity.imageryStyle}</p>
              </div>

              {/* Design Principles + Moodboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Design Principles</p>
                  <ul className="space-y-1.5">
                    {result.visualIdentity.designPrinciples.map((p, i) => (
                      <li key={i} className="text-sm text-dark-200 flex items-start gap-2">
                        <span className="text-accent mt-1.5 text-[6px]">&#9679;</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Moodboard</p>
                  <div className="flex flex-wrap gap-2">
                    {result.visualIdentity.moodboardKeywords.map((kw, i) => (
                      <span key={i} className="text-xs bg-white/30 text-dark-300 border border-white/40 px-2.5 py-1 rounded-full capitalize">{kw}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

        </div>
      )}
    </div>
  )
}
