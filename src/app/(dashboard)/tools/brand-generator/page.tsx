'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import {
  ArrowLeft, Wand2, Loader2, ChevronDown, ChevronUp, Copy, Check,
  Target, Eye, Heart, Crosshair, Smile, MessageCircle, Users, Swords,
  Star, BookOpen, RefreshCw, Sparkles, Palette, Type, ImageIcon, Layers,
  Download, History, Trash2, Clock, LayoutGrid, Zap, Lock,
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

interface BrandHistoryItem {
  id: number
  brand_name: string
  tagline: string
  industry: string
  created_at: string
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

function getLuminanceRGB(r: number, g: number, b: number): number {
  const vals = [r, g, b].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) })
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

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---- PDF Generator ----
async function generateBrandPDF(result: GeneratedBrand) {
  const { jsPDF } = await import('jspdf')
  const { sanitizePdfText: s } = await import('@/lib/utils')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const pageW = 210
  const pageH = 297
  const margin = 20
  const contentW = pageW - margin * 2
  let y = margin

  const checkPage = (needed = 10) => {
    if (y + needed > pageH - margin - 10) {
      doc.addPage()
      y = margin
    }
  }

  const drawDivider = () => {
    checkPage(8)
    doc.setDrawColor(220, 220, 230)
    doc.line(margin, y, pageW - margin, y)
    y += 8
  }

  const drawSectionLabel = (text: string) => {
    checkPage(8)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(99, 102, 241)
    doc.text(s(text).toUpperCase(), margin, y)
    y += 5
  }

  const drawBody = (text: string, size = 10, color: [number, number, number] = [55, 55, 65]) => {
    if (!text) return
    doc.setFontSize(size)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(s(text), contentW) as string[]
    lines.forEach((line) => {
      checkPage(size * 0.45 + 1.5)
      doc.text(line, margin, y)
      y += size * 0.45 + 1.5
    })
    y += 2
  }

  const drawSwatches = (colors: string[]) => {
    checkPage(22)
    const gap = 3
    const swW = (contentW - gap * (colors.length - 1)) / colors.length
    colors.forEach((color, i) => {
      const hex = color.replace('#', '')
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      const x = margin + i * (swW + gap)
      doc.setFillColor(r, g, b)
      doc.roundedRect(x, y, swW, 14, 2, 2, 'F')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      const lum = getLuminanceRGB(r, g, b)
      doc.setTextColor(lum > 0.4 ? 30 : 240, lum > 0.4 ? 30 : 240, lum > 0.4 ? 30 : 240)
      doc.text(color.toUpperCase(), x + swW / 2, y + 8.5, { align: 'center' })
    })
    y += 18
  }

  // === HEADER BAR ===
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageW, 6, 'F')
  y = 18

  // Brand Name
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 30)
  doc.text(s(result.brand.name), margin, y)
  y += 10

  // Tagline
  doc.setFontSize(12)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(99, 102, 241)
  doc.text(`"${s(result.brand.tagline)}"`, margin, y)
  y += 8

  // Industry pill
  doc.setFillColor(238, 240, 255)
  doc.roundedRect(margin, y, 50, 7, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(99, 102, 241)
  doc.text(s(result.brand.industry).toUpperCase(), margin + 4, y + 4.8)
  y += 13

  drawSectionLabel('Concept')
  drawBody(result.brand.concept)
  drawDivider()

  // === BRAND STRATEGY ===
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 30)
  doc.text('Brand Strategy', margin, y)
  y += 8

  const strategyFields: { label: string; value: string | string[]; isList?: boolean }[] = [
    { label: 'Mission', value: result.strategy.mission },
    { label: 'Vision', value: result.strategy.vision },
    { label: 'Positioning', value: result.strategy.positioning },
    { label: 'Brand Personality', value: result.strategy.personality },
    { label: 'Tone of Voice', value: result.strategy.toneOfVoice },
    { label: 'Target Audience', value: result.strategy.targetAudience },
    { label: 'Brand Story', value: result.strategy.brandStory },
    { label: 'Core Values', value: result.strategy.values, isList: true },
    { label: 'Differentiators', value: result.strategy.differentiators, isList: true },
    { label: 'Competitors', value: result.strategy.competitors, isList: true },
  ]

  strategyFields.forEach(({ label, value, isList }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return
    drawSectionLabel(label)
    if (isList && Array.isArray(value)) {
      value.forEach((item) => drawBody(`• ${item}`))
    } else {
      drawBody(value as string)
    }
  })

  drawDivider()

  // === VISUAL IDENTITY ===
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 30)
  doc.text('Visual Identity Guide', margin, y)
  y += 8

  drawSectionLabel(`Primary Palette — ${result.visualIdentity.primaryPalette.name}`)
  drawBody(result.visualIdentity.primaryPalette.rationale)
  drawSwatches(result.visualIdentity.primaryPalette.colors)

  drawSectionLabel(`Secondary Palette — ${result.visualIdentity.secondaryPalette.name}`)
  drawBody(result.visualIdentity.secondaryPalette.rationale)
  drawSwatches(result.visualIdentity.secondaryPalette.colors)

  drawSectionLabel('Typography')
  drawBody(`Heading: ${result.visualIdentity.typography.heading} · Weight ${result.visualIdentity.typography.headingWeight}`)
  drawBody(`Body: ${result.visualIdentity.typography.body} · Weight ${result.visualIdentity.typography.bodyWeight}`)
  drawBody(result.visualIdentity.typography.rationale)

  drawSectionLabel('Logo Direction')
  drawBody(result.visualIdentity.logoDirection)

  drawSectionLabel('Imagery Style')
  drawBody(result.visualIdentity.imageryStyle)

  drawSectionLabel('Design Principles')
  result.visualIdentity.designPrinciples.forEach((p) => drawBody(`• ${p}`))

  drawSectionLabel('Moodboard Keywords')
  drawBody(result.visualIdentity.moodboardKeywords.join('  ·  '))

  // === FOOTER on every page ===
  const totalPages = (doc as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(160, 160, 170)
    doc.text(s(`${result.brand.name} Brand Guide  -  Generated by Seysey Studios`), margin, pageH - 8)
    doc.text(`${i} / ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' })
  }

  doc.save(`${result.brand.name.replace(/\s+/g, '-').toLowerCase()}-brand-guide.pdf`)
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
  const [availableProviders, setAvailableProviders] = useState({ claude: false, gemini: false, chatgpt: false })
  const [provider, setProvider] = useState<'claude' | 'gemini' | 'chatgpt'>('claude')
  const [mode, setMode] = useState<'fast' | 'quality'>('quality')
  const [prompt, setPrompt] = useState('')
  const [industry, setIndustry] = useState('')
  const [moods, setMoods] = useState<string[]>([])
  const [targetAudience, setTargetAudience] = useState('')
  const [showRefine, setShowRefine] = useState(false)
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<GeneratedBrand | null>(null)
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [savedBrandId, setSavedBrandId] = useState<number | null>(null)

  // History
  const [history, setHistory] = useState<BrandHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/brief/generate').then(r => r.json()).then(d => {
      setAiAvailable(d.available)
      if (d.providers) {
        setAvailableProviders(d.providers)
        // auto-select first available provider
        const first = (['claude', 'gemini', 'chatgpt'] as const).find(p => d.providers[p])
        if (first) setProvider(first)
      }
    }).catch(() => {})
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/brands')
      const data = await res.json()
      setHistory(data.brands ?? [])
    } catch {}
    setHistoryLoading(false)
  }

  const saveBrand = async (brandResult: GeneratedBrand, brandPrompt: string) => {
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: brandResult, prompt: brandPrompt }),
      })
      const data = await res.json()
      if (data.id) setSavedBrandId(data.id)
      loadHistory()
    } catch {}
  }

  const loadFromHistory = async (id: number) => {
    try {
      const res = await fetch(`/api/brands/${id}`)
      const data = await res.json()
      setResult(data.result)
      setShowHistory(false)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch {}
  }

  const deleteFromHistory = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await fetch(`/api/brands/${id}`, { method: 'DELETE' })
      setHistory(prev => prev.filter(b => b.id !== id))
    } catch {}
    setDeletingId(null)
  }

  const toggleMood = (mood: string) => {
    setMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood])
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setElapsed(0)
    setError('')
    setResult(null)
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    try {
      const res = await fetch('/api/brief/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, industry: industry || undefined, moods: moods.length ? moods : undefined, targetAudience: targetAudience || undefined, provider, mode }),
      })
      const data = await res.json()
      if (!data.available) { setError('AI is not configured. Please add your Anthropic API key.'); return }
      if (data.error) { setError(data.error); return }
      setResult(data.result)
      saveBrand(data.result, prompt)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      if (timerRef.current) clearInterval(timerRef.current)
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
    setSavedBrandId(null)
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

  const handleDownloadPDF = async () => {
    if (!result) return
    setPdfLoading(true)
    try {
      await generateBrandPDF(result)
    } catch (e) {
      console.error('PDF generation failed:', e)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-dark-100 transition-colors">
        <ArrowLeft size={16} /> Back to Tools
      </Link>

      {/* History Panel */}
      {(history.length > 0 || historyLoading) && (
        <Card className="!p-0 overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-dark-200">
              <History size={15} className="text-accent" />
              Brand History
              <span className="text-xs text-dark-400 font-normal">({history.length} saved)</span>
            </span>
            {showHistory ? <ChevronUp size={15} className="text-dark-400" /> : <ChevronDown size={15} className="text-dark-400" />}
          </button>

          {showHistory && (
            <div className="border-t border-white/20 px-5 py-3 space-y-1.5 max-h-72 overflow-y-auto">
              {historyLoading ? (
                <p className="text-xs text-dark-400 py-2">Loading...</p>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-left group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-dark-100 truncate">{item.brand_name}</p>
                      <p className="text-xs text-dark-400 truncate italic">&ldquo;{item.tagline}&rdquo;</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-dark-400 hidden sm:flex items-center gap-1">
                        <Clock size={10} />{formatDate(item.created_at)}
                      </span>
                      <span
                        role="button"
                        onClick={(e) => deleteFromHistory(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-dark-400 hover:text-red-400"
                      >
                        {deletingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </Card>
      )}

      {/* Input Card */}
      <Card>
        <h3 className="font-serif text-lg font-normal text-dark-100 mb-1">Brand Generator</h3>
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

        {/* Provider + Mode picker */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">AI Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'claude',  label: 'Claude',  sub: 'Anthropic' },
                { id: 'gemini',  label: 'Gemini',  sub: 'Google' },
                { id: 'chatgpt', label: 'ChatGPT', sub: 'OpenAI' },
              ] as const).map(({ id, label, sub }) => {
                const available = availableProviders[id]
                const active = provider === id
                return (
                  <button
                    key={id}
                    onClick={() => available && setProvider(id)}
                    disabled={!available}
                    className={`relative flex flex-col items-center gap-0.5 rounded-xl border px-3 py-2.5 text-center transition-all cursor-pointer disabled:cursor-not-allowed ${
                      active && available
                        ? 'border-accent bg-accent/15 text-dark-100'
                        : available
                        ? 'border-white/10 bg-white/5 text-dark-300 hover:border-white/20'
                        : 'border-white/5 bg-white/[0.02] text-dark-500 opacity-50'
                    }`}
                  >
                    {!available && <Lock size={10} className="absolute top-1.5 right-1.5 opacity-60" />}
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-[10px] opacity-60">{sub}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('fast')}
                className={`flex flex-col gap-0.5 rounded-xl border px-4 py-2.5 text-left transition-all cursor-pointer ${mode === 'fast' ? 'border-accent bg-accent/15 text-dark-100' : 'border-white/10 bg-white/5 text-dark-400 hover:border-white/20'}`}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold"><Zap size={11} /> Fast</span>
                <span className="text-[10px] opacity-60">
                  {provider === 'claude' ? 'Haiku' : provider === 'gemini' ? 'Flash 2.0' : 'GPT-4o mini'} · ~10s
                </span>
              </button>
              <button
                onClick={() => setMode('quality')}
                className={`flex flex-col gap-0.5 rounded-xl border px-4 py-2.5 text-left transition-all cursor-pointer ${mode === 'quality' ? 'border-accent bg-accent/15 text-dark-100' : 'border-white/10 bg-white/5 text-dark-400 hover:border-white/20'}`}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold"><Sparkles size={11} /> Quality</span>
                <span className="text-[10px] opacity-60">
                  {provider === 'claude' ? 'Sonnet 4.6' : provider === 'gemini' ? 'Pro 1.5' : 'GPT-4o'} · ~25s
                </span>
              </button>
            </div>
          </div>
        </div>

        {!aiAvailable && (
          <p className="text-xs text-amber-400 mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            AI not configured. Add your Anthropic or Gemini API key.
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

        {loading && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-dark-400">
              <span className="text-dark-300">
                {elapsed < 6 ? 'Analyzing your brief...' : elapsed < 14 ? 'Crafting brand strategy...' : elapsed < 22 ? 'Building visual identity...' : 'Finalizing your brand...'}
              </span>
              <span className="tabular-nums text-dark-400">{elapsed}s</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min((elapsed / 28) * 100, 95)}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Results */}
      {result && (
        <div ref={resultsRef} className="space-y-6">

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-dark-300">Generated Brand</h3>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {savedBrandId && (
                <Link
                  href={`/tools/social-content?brandId=${savedBrandId}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors cursor-pointer px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/40 hover:bg-accent/25"
                >
                  <LayoutGrid size={13} /> Generate Social Content
                </Link>
              )}
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-dark-100 transition-colors cursor-pointer px-3 py-1.5 rounded-lg bg-white/30 border border-white/40 disabled:opacity-50"
              >
                {pdfLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                {pdfLoading ? 'Generating...' : 'Download PDF'}
              </button>
              <button onClick={handleCopyAll} className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-dark-100 transition-colors cursor-pointer px-3 py-1.5 rounded-lg bg-white/30 border border-white/40">
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy All</>}
              </button>
            </div>
          </div>

          {/* 1. Brand Identity */}
          <Card>
            <h3 className="font-serif text-lg font-normal text-dark-100 mb-4">Brand Identity</h3>
            <h2 className="text-3xl font-bold text-dark-100 mb-1">{result.brand.name}</h2>
            <p className="text-base text-accent italic mb-3">&ldquo;{result.brand.tagline}&rdquo;</p>
            <span className="text-xs bg-white/30 text-dark-300 px-2.5 py-1 rounded-full capitalize">{result.brand.industry}</span>
            <p className="text-sm text-dark-200 leading-relaxed mt-4">{result.brand.concept}</p>
          </Card>

          {/* 2. Brand Strategy */}
          <Card>
            <h3 className="font-serif text-lg font-normal text-dark-100 mb-4">Brand Strategy</h3>
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
            <h3 className="font-serif text-lg font-normal text-dark-100 mb-5">Visual Identity Guide</h3>

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
