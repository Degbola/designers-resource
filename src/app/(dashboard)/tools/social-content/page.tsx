'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import {
  ArrowLeft, Loader2, Sparkles, Copy, Check, ChevronDown, ChevronUp,
  Instagram, Linkedin, Twitter, Facebook, LayoutGrid, RefreshCw,
  Image as ImageIcon, Film, Layers, BookOpen, Megaphone, Heart,
  Lightbulb, Users, Star, Zap, Eye, Palette, Type, AlignLeft,
  Download, History, Trash2, Clock, Target, TrendingUp, MousePointerClick,
  PenLine, FileText,
} from 'lucide-react'
import Link from 'next/link'

// ---- Types ----
interface GeneratedBrand {
  brand: { name: string; tagline: string; industry: string; concept: string }
  strategy: {
    mission: string; vision: string; values: string[]; positioning: string
    personality: string; toneOfVoice: string; targetAudience: string
    competitors: string[]; differentiators: string[]; brandStory: string
  }
  visualIdentity: {
    primaryPalette: { name: string; colors: string[]; rationale: string }
    secondaryPalette: { name: string; colors: string[]; rationale: string }
    typography: { heading: string; body: string; headingWeight: number; bodyWeight: number; rationale: string }
    logoDirection: string; imageryStyle: string; designPrinciples: string[]; moodboardKeywords: string[]
  }
}

interface BrandHistoryItem {
  id: number
  brand_name: string
  tagline: string
  industry: string
  created_at: string
}

interface SocialPost {
  id: number
  contentType: string
  format: string
  designCopy: { headline: string; subtext: string; cta: string }
  captions: Record<string, string>
  hashtags: string[]
  visual: { composition: string; colorUsage: string; typography: string; imagery: string; mood: string }
}

interface ContentHistoryItem {
  id: number
  brand_name: string
  platforms: string
  content_types: string
  format_preference: string
  post_count: number
  created_at: string
}

interface ContentStrategyInput {
  goals: string[]
  keyMessage: string
  ctas: string[]
  theme: string
  emotions: string[]
}

interface CustomBrandForm {
  name: string; industry: string; tagline: string; concept: string
  personality: string; tone: string; targetAudience: string; values: string
  primaryColors: string; secondaryColors: string; headingFont: string; bodyFont: string
  imageryStyle: string; brief: string
}

// ---- Constants ----
const PLATFORMS = [
  { value: 'Instagram', icon: Instagram, active: 'bg-pink-500/15 border-pink-500/40 text-pink-300' },
  { value: 'LinkedIn', icon: Linkedin, active: 'bg-blue-500/15 border-blue-500/40 text-blue-300' },
  { value: 'Twitter / X', icon: Twitter, active: 'bg-sky-500/15 border-sky-500/40 text-sky-300' },
  { value: 'Facebook', icon: Facebook, active: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300' },
  { value: 'TikTok', icon: Film, active: 'bg-rose-500/15 border-rose-500/40 text-rose-300' },
  { value: 'Pinterest', icon: ImageIcon, active: 'bg-red-500/15 border-red-500/40 text-red-300' },
]

const PLATFORM_BADGE: Record<string, string> = {
  'Instagram': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'LinkedIn': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Twitter / X': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'Facebook': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'TikTok': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'Pinterest': 'bg-red-500/20 text-red-300 border-red-500/30',
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'Instagram': Instagram, 'LinkedIn': Linkedin, 'Twitter / X': Twitter,
  'Facebook': Facebook, 'TikTok': Film, 'Pinterest': ImageIcon,
}

const CONTENT_TYPES = [
  { value: 'Lifestyle', icon: Heart },
  { value: 'Promotional', icon: Megaphone },
  { value: 'Quote Card', icon: BookOpen },
  { value: 'Educational / Tips', icon: Lightbulb },
  { value: 'Behind the Scenes', icon: Eye },
  { value: 'Product / Service Spotlight', icon: Star },
  { value: 'Community', icon: Users },
  { value: 'Launch / Announcement', icon: Zap },
]

const FORMAT_OPTIONS = [
  { value: 'single', label: 'Single Image', desc: 'All posts as single graphics', icon: ImageIcon },
  { value: 'carousel', label: 'Carousel', desc: 'All posts as carousels', icon: Layers },
  { value: 'reel', label: 'Reel / Video', desc: 'All as short video concepts', icon: Film },
  { value: 'mix-single-carousel', label: 'Image + Carousel', desc: 'Mix of single & carousel', icon: LayoutGrid },
  { value: 'mix-all', label: 'All Formats', desc: 'Image, carousel & reel variety', icon: Sparkles },
]

const POST_COUNTS = [3, 5, 8, 10, 15, 20]

const FORMAT_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'Carousel': Layers, 'Reel / Short Video': Film, 'Single Image': ImageIcon,
}

const STRATEGY_GOALS = [
  { value: 'Brand Awareness', icon: Eye },
  { value: 'Drive Sales', icon: Megaphone },
  { value: 'Grow Following', icon: TrendingUp },
  { value: 'Educate Audience', icon: Lightbulb },
  { value: 'Product Launch', icon: Zap },
  { value: 'Build Community', icon: Users },
  { value: 'Promote Event', icon: Star },
]

const STRATEGY_CTAS = [
  'Visit Website', 'Shop Now', 'Book a Call', 'Follow Us',
  'Sign Up', 'Share This', 'Comment Below', 'DM Us',
]

const STRATEGY_EMOTIONS = [
  'Inspired', 'Informed', 'Excited', 'Motivated',
  'Comforted', 'Entertained', 'Challenged', 'Curious',
]

// ---- Helpers ----
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---- PDF Generator ----
async function generateSocialPDF(posts: SocialPost[], brand: GeneratedBrand, platforms: string[]) {
  const { jsPDF } = await import('jspdf')
  const { sanitizePdfText: s } = await import('@/lib/utils')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210, pageH = 297, margin = 20, contentW = pageW - margin * 2
  let y = margin

  const checkPage = (needed = 10) => {
    if (y + needed > pageH - margin - 10) { doc.addPage(); y = margin }
  }

  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageW, 6, 'F')
  y = 16
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 30)
  doc.text(s(`${brand.brand.name} - Social Content`), margin, y); y += 7
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 120)
  doc.text(s(`${posts.length} posts  -  ${platforms.join(', ')}  -  Seysey Studios`), margin, y); y += 7

  const allColors = [...brand.visualIdentity.primaryPalette.colors, ...brand.visualIdentity.secondaryPalette.colors]
  allColors.slice(0, 10).forEach((color, i) => {
    const hex = color.replace('#', '')
    doc.setFillColor(parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16))
    doc.circle(margin + i * 7, y + 2, 2.5, 'F')
  })
  y += 10
  doc.setDrawColor(220, 220, 230); doc.line(margin, y, pageW - margin, y); y += 8

  for (const post of posts) {
    checkPage(80)
    doc.setFillColor(245, 245, 255)
    doc.roundedRect(margin, y, contentW, 9, 1.5, 1.5, 'F')
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(99, 102, 241)
    doc.text(s(`${post.contentType}  -  ${post.format}`), margin + 3, y + 6); y += 13

    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(99, 102, 241)
    doc.text('DESIGN COPY', margin, y); y += 5
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 15, 25)
    const hlLines = doc.splitTextToSize(s(post.designCopy.headline), contentW) as string[]
    hlLines.forEach(l => { checkPage(9); doc.text(l, margin, y); y += 7 })
    if (post.designCopy.subtext) {
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 75)
      const stLines = doc.splitTextToSize(s(post.designCopy.subtext), contentW) as string[]
      stLines.forEach(l => { checkPage(6); doc.text(l, margin, y); y += 5 })
    }
    if (post.designCopy.cta) {
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(99, 102, 241)
      doc.text(`> ${s(post.designCopy.cta)}`, margin, y); y += 6
    }
    y += 2

    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(99, 102, 241)
    doc.text('CAPTIONS', margin, y); y += 5
    for (const platform of platforms) {
      const caption = post.captions?.[platform]
      if (!caption) continue
      checkPage(12)
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 100)
      doc.text(s(platform), margin, y); y += 4
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 55, 70)
      const capLines = doc.splitTextToSize(s(caption), contentW) as string[]
      capLines.forEach(l => { checkPage(5); doc.text(l, margin, y); y += 4.5 })
      y += 2
    }
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(99, 102, 241)
    const hashText = s(post.hashtags.map(t => `#${t}`).join('  '))
    const hashLines = doc.splitTextToSize(hashText, contentW) as string[]
    hashLines.forEach(l => { checkPage(5); doc.text(l, margin, y); y += 4.5 })
    y += 3

    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(99, 102, 241)
    doc.text('VISUAL DIRECTION', margin, y); y += 5
    const vFields = [
      { label: 'Mood', val: post.visual.mood },
      { label: 'Composition', val: post.visual.composition },
      { label: 'Color Usage', val: post.visual.colorUsage },
      { label: 'Typography', val: post.visual.typography },
      { label: 'Imagery', val: post.visual.imagery },
    ]
    for (const { label, val } of vFields) {
      checkPage(8)
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 100)
      doc.text(`${s(label)}:`, margin, y)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 55, 70)
      const vLines = doc.splitTextToSize(s(val), contentW - 32) as string[]
      doc.text(vLines[0], margin + 32, y); y += 4.5
      vLines.slice(1).forEach(l => { checkPage(5); doc.text(l, margin + 32, y); y += 4.5 })
    }
    y += 4
    doc.setDrawColor(220, 220, 230); doc.line(margin, y, pageW - margin, y); y += 8
  }

  const totalPages = (doc as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 170)
    doc.text(s(`${brand.brand.name} Social Content  -  Seysey Studios`), margin, pageH - 8)
    doc.text(`${i} / ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' })
  }
  doc.save(`${brand.brand.name.replace(/\s+/g, '-').toLowerCase()}-social-content.pdf`)
}

// ---- Post Card ----
function PostCard({ post, platforms, brand, forceVisualOpen }: {
  post: SocialPost; platforms: string[]; brand: GeneratedBrand; forceVisualOpen: boolean
}) {
  const [copiedHeadline, setCopiedHeadline] = useState(false)
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)
  const [copiedHashtags, setCopiedHashtags] = useState(false)
  const [visualOpen, setVisualOpen] = useState(false)
  const [activePlatform, setActivePlatform] = useState(platforms[0] ?? '')

  const showVisual = forceVisualOpen || visualOpen
  const FormatIcon = FORMAT_ICONS[post.format] ?? ImageIcon
  const allColors = [...brand.visualIdentity.primaryPalette.colors, ...brand.visualIdentity.secondaryPalette.colors]

  const copyHeadline = () => {
    const text = [post.designCopy.headline, post.designCopy.subtext, post.designCopy.cta].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text)
    setCopiedHeadline(true); setTimeout(() => setCopiedHeadline(false), 1500)
  }
  const copyCaption = (platform: string) => {
    const caption = post.captions?.[platform] ?? ''
    navigator.clipboard.writeText(`${caption}\n\n${post.hashtags.map(t => `#${t}`).join(' ')}`)
    setCopiedPlatform(platform); setTimeout(() => setCopiedPlatform(null), 1500)
  }
  const copyHashtags = () => {
    navigator.clipboard.writeText(post.hashtags.map(t => `#${t}`).join(' '))
    setCopiedHashtags(true); setTimeout(() => setCopiedHashtags(false), 1500)
  }

  return (
    <Card className="flex flex-col !p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/20 bg-white/10">
        <span className="text-xs font-medium text-dark-300">{post.contentType}</span>
        <span className="flex items-center gap-1 text-[11px] text-dark-400">
          <FormatIcon size={11} /> {post.format}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Design Copy */}
        <div className="bg-white/20 rounded-xl border border-white/30 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-accent uppercase tracking-wider">Design Copy</label>
            <button onClick={copyHeadline} className="flex items-center gap-1 text-[10px] text-dark-400 hover:text-dark-100 transition-colors cursor-pointer">
              {copiedHeadline ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
            </button>
          </div>
          <p className="text-lg font-bold text-dark-100 leading-tight">{post.designCopy.headline}</p>
          {post.designCopy.subtext && (
            <p className="text-sm text-dark-300 mt-1 leading-snug">{post.designCopy.subtext}</p>
          )}
          {post.designCopy.cta && (
            <span className="inline-block mt-2 text-xs font-semibold text-accent border border-accent/40 bg-accent/10 px-2.5 py-1 rounded-full">
              {post.designCopy.cta}
            </span>
          )}
        </div>

        {/* Per-Platform Captions */}
        <div>
          <label className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1 mb-2">
            <AlignLeft size={10} /> Captions
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {platforms.map(p => {
              const Icon = PLATFORM_ICONS[p] ?? LayoutGrid
              const badge = PLATFORM_BADGE[p] ?? 'bg-white/20 text-dark-300 border-white/30'
              return (
                <button key={p} onClick={() => setActivePlatform(p)}
                  className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full border transition-all cursor-pointer ${
                    activePlatform === p ? badge : 'bg-white/10 text-dark-400 border-white/20 hover:bg-white/20'
                  }`}>
                  <Icon size={10} /> {p}
                </button>
              )
            })}
          </div>
          {activePlatform && post.captions?.[activePlatform] !== undefined && (
            <div className="relative">
              <p className="text-sm text-dark-100 leading-relaxed bg-white/20 rounded-lg px-3 py-2.5 pr-16 whitespace-pre-line">
                {post.captions[activePlatform]}
              </p>
              <button onClick={() => copyCaption(activePlatform)}
                className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-dark-400 hover:text-dark-100 transition-colors cursor-pointer bg-white/30 px-2 py-0.5 rounded">
                {copiedPlatform === activePlatform ? <><Check size={9} /> Done</> : <><Copy size={9} /> Copy</>}
              </button>
            </div>
          )}
        </div>

        {/* Hashtags */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-accent uppercase tracking-wider"># Hashtags</label>
            <button onClick={copyHashtags} className="flex items-center gap-1 text-[10px] text-dark-400 hover:text-dark-100 transition-colors cursor-pointer">
              {copiedHashtags ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {post.hashtags.map((tag, i) => (
              <span key={i} className="text-xs text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
        </div>

        {/* Visual Direction */}
        <button onClick={() => setVisualOpen(!visualOpen)}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer border border-white/30">
          <span className="text-xs font-semibold text-dark-100 flex items-center gap-1.5">
            <Palette size={12} className="text-accent" /> Visual Direction
          </span>
          {showVisual ? <ChevronUp size={13} className="text-dark-400" /> : <ChevronDown size={13} className="text-dark-400" />}
        </button>

        {showVisual && (
          <div className="space-y-3.5 border-t border-white/20 pt-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold text-dark-400 uppercase tracking-wider shrink-0">Mood</span>
              <span className="text-sm font-medium text-dark-100 italic">{post.visual.mood}</span>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <ImageIcon size={9} /> Composition
              </p>
              <p className="text-xs text-dark-200 leading-relaxed">{post.visual.composition}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-pink-300 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <Palette size={9} /> Color Usage
                <span className="flex gap-0.5">
                  {allColors.slice(0, 6).map((c, i) => (
                    <span key={i} className="inline-block w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: c }} title={c} />
                  ))}
                </span>
              </p>
              <p className="text-xs text-dark-200 leading-relaxed">{post.visual.colorUsage}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Type size={9} /> Typography
              </p>
              <p className="text-xs text-dark-200 leading-relaxed">{post.visual.typography}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Eye size={9} /> Imagery & Art Direction
              </p>
              <p className="text-xs text-dark-200 leading-relaxed">{post.visual.imagery}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ---- Main Page ----
export default function SocialContentPage() {
  const resultsRef = useRef<HTMLDivElement>(null)

  const [aiAvailable, setAiAvailable] = useState(false)
  const [brandHistory, setBrandHistory] = useState<BrandHistoryItem[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [brand, setBrand] = useState<GeneratedBrand | null>(null)
  const [brandLoading, setBrandLoading] = useState(false)

  const [postCount, setPostCount] = useState(5)
  const [platforms, setPlatforms] = useState<string[]>(['Instagram', 'LinkedIn'])
  const [contentTypes, setContentTypes] = useState<string[]>(['Lifestyle', 'Promotional'])
  const [formatPreference, setFormatPreference] = useState('mix-all')
  const [strategy, setStrategy] = useState<ContentStrategyInput>({ goals: [], keyMessage: '', ctas: [], theme: '', emotions: [] })
  const [notes, setNotes] = useState('')

  const [mode, setMode] = useState<'fast' | 'quality'>('quality')
  const [provider, setProvider] = useState<'claude' | 'gemini' | 'chatgpt'>('claude')
  const [availableProviders, setAvailableProviders] = useState({ claude: false, gemini: false, chatgpt: false })
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [error, setError] = useState('')
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [allVisualOpen, setAllVisualOpen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const [contentHistory, setContentHistory] = useState<ContentHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [currentHistoryId, setCurrentHistoryId] = useState<number | null>(null)

  const [brandSource, setBrandSource] = useState<'saved' | 'custom'>('saved')
  const [customMode, setCustomMode] = useState<'form' | 'brief'>('form')
  const [customBrandForm, setCustomBrandForm] = useState<CustomBrandForm>({
    name: '', industry: '', tagline: '', concept: '',
    personality: '', tone: '', targetAudience: '', values: '',
    primaryColors: '', secondaryColors: '', headingFont: '', bodyFont: '',
    imageryStyle: '', brief: '',
  })

  useEffect(() => {
    fetch('/api/social-content').then(r => r.json()).then(d => {
      setAiAvailable(d.available)
      if (d.providers) {
        setAvailableProviders(d.providers)
        const first = (['claude', 'gemini', 'chatgpt'] as const).find(p => d.providers[p])
        if (first) setProvider(first)
      }
    }).catch(() => {})
    loadContentHistory()

    const params = new URLSearchParams(window.location.search)
    const brandIdParam = params.get('brandId')

    ;(async () => {
      try {
        const res = await fetch('/api/brands')
        const data = await res.json()
        const brands: BrandHistoryItem[] = data.brands ?? []
        setBrandHistory(brands)
        if (brandIdParam) {
          const id = Number(brandIdParam)
          setSelectedBrandId(id); fetchBrand(id)
        } else if (brands.length > 0) {
          setSelectedBrandId(brands[0].id); fetchBrand(brands[0].id)
        }
      } catch {}
    })()
  }, [])

  const loadContentHistory = async () => {
    try {
      const res = await fetch('/api/social-content-history')
      const data = await res.json()
      setContentHistory(data.items ?? [])
    } catch {}
  }

  const fetchBrand = async (id: number) => {
    setBrandLoading(true)
    try {
      const res = await fetch(`/api/brands/${id}`)
      const data = await res.json()
      setBrand(data.result)
    } catch {}
    setBrandLoading(false)
  }

  const loadFromHistory = async (id: number) => {
    try {
      const res = await fetch(`/api/social-content-history/${id}`)
      const data = await res.json()
      setPosts(data.posts ?? [])
      setCurrentHistoryId(id)
      setShowHistory(false)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch {}
  }

  const deleteFromHistory = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await fetch(`/api/social-content-history/${id}`, { method: 'DELETE' })
      setContentHistory(prev => prev.filter(i => i.id !== id))
      if (currentHistoryId === id) setPosts([])
    } catch {}
    setDeletingId(null)
  }

  const handleGenerate = async () => {
    if (!effectiveBrand || platforms.length === 0 || contentTypes.length === 0) return
    setLoading(true); setElapsed(0); setError(''); setPosts([]); setCurrentHistoryId(null)
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    const abortController = new AbortController()
    const abortTimeout = setTimeout(() => abortController.abort(), 110_000)
    try {
      const res = await fetch('/api/social-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          brand: effectiveBrand, count: postCount, platforms, contentTypes, formatPreference, notes: notes || undefined, mode, provider,
          strategy: (strategy.goals.length || strategy.keyMessage || strategy.ctas.length || strategy.theme || strategy.emotions.length) ? strategy : undefined,
        }),
      })
      const data = await res.json()
      if (!data.available) { setError('AI is not configured.'); return }
      if (data.error) { setError(data.error); return }
      const newPosts: SocialPost[] = data.result?.posts ?? []
      setPosts(newPosts)
      try {
        const saveRes = await fetch('/api/social-content-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand_name: effectiveBrand.brand.name, platforms, content_types: contentTypes, format_preference: formatPreference, posts: newPosts }),
        })
        const saveData = await saveRes.json()
        if (saveData.id) setCurrentHistoryId(saveData.id)
        loadContentHistory()
      } catch {}
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e: unknown) {
      const isAbort = e instanceof Error && e.name === 'AbortError'
      setError(isAbort
        ? `Generation timed out after 110s. Try reducing the post count (currently ${postCount}) and regenerating.`
        : 'Something went wrong. Please try again.')
    }
    finally { clearTimeout(abortTimeout); if (timerRef.current) clearInterval(timerRef.current); setLoading(false) }
  }

  const handleDownloadPDF = async () => {
    if (!posts.length || !effectiveBrand) return
    setPdfLoading(true)
    try { await generateSocialPDF(posts, effectiveBrand, platforms) } catch (e) { console.error(e) }
    setPdfLoading(false)
  }

  const handleCopyAll = () => {
    const text = posts.map((p, i) => [
      `--- ${i + 1}. ${p.contentType} | ${p.format} ---`,
      `DESIGN COPY`,
      `Headline: ${p.designCopy.headline}`,
      p.designCopy.subtext ? `Subtext: ${p.designCopy.subtext}` : '',
      p.designCopy.cta ? `CTA: ${p.designCopy.cta}` : '',
      ``,
      `CAPTIONS`,
      ...Object.entries(p.captions ?? {}).map(([pl, cap]) => `${pl}: ${cap}`),
      ``,
      `Hashtags: ${p.hashtags.map(t => `#${t}`).join(' ')}`,
      ``,
      `VISUAL DIRECTION`,
      `Mood: ${p.visual.mood}`,
      `Composition: ${p.visual.composition}`,
      `Colors: ${p.visual.colorUsage}`,
      `Typography: ${p.visual.typography}`,
      `Imagery: ${p.visual.imagery}`,
    ].filter(Boolean).join('\n')).join('\n\n')
    navigator.clipboard.writeText(text)
  }

  const buildCustomBrand = (form: CustomBrandForm): GeneratedBrand => ({
    brand: { name: form.name, tagline: form.tagline || '', industry: form.industry, concept: form.brief || form.concept || '' },
    strategy: {
      mission: '', vision: '',
      values: form.values ? form.values.split(',').map(v => v.trim()).filter(Boolean) : [],
      positioning: '', personality: form.personality || '',
      toneOfVoice: form.tone || '', targetAudience: form.targetAudience || '',
      competitors: [], differentiators: [], brandStory: '',
    },
    visualIdentity: {
      primaryPalette: { name: 'Primary', colors: form.primaryColors ? form.primaryColors.split(',').map(c => c.trim()).filter(Boolean) : [], rationale: '' },
      secondaryPalette: { name: 'Secondary', colors: form.secondaryColors ? form.secondaryColors.split(',').map(c => c.trim()).filter(Boolean) : [], rationale: '' },
      typography: { heading: form.headingFont || 'Sans-serif', body: form.bodyFont || 'Sans-serif', headingWeight: 700, bodyWeight: 400, rationale: '' },
      logoDirection: '', imageryStyle: form.imageryStyle || '', designPrinciples: [], moodboardKeywords: [],
    },
  })

  const effectiveBrand: GeneratedBrand | null = brandSource === 'saved'
    ? brand
    : (customBrandForm.name && customBrandForm.industry ? buildCustomBrand(customBrandForm) : null)

  const brandReady = brandSource === 'saved' ? !!brand : (!!customBrandForm.name && !!customBrandForm.industry)
  const canGenerate = brandReady && platforms.length > 0 && contentTypes.length > 0 && aiAvailable && !loading

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-dark-100 transition-colors">
        <ArrowLeft size={16} /> Back to Tools
      </Link>

      <div>
        <h2 className="font-serif text-lg font-normal text-dark-100 mb-1">Social Media Content</h2>
        <p className="text-sm text-dark-400">Generate short design copy + per-platform captions and visual direction for social media graphics.</p>
      </div>

      {/* History Panel */}
      {contentHistory.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <button onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/10 transition-colors cursor-pointer">
            <span className="flex items-center gap-2 text-sm font-medium text-dark-200">
              <History size={15} className="text-accent" />
              Content History
              <span className="text-xs text-dark-400 font-normal">({contentHistory.length} saved)</span>
            </span>
            {showHistory ? <ChevronUp size={15} className="text-dark-400" /> : <ChevronDown size={15} className="text-dark-400" />}
          </button>
          {showHistory && (
            <div className="border-t border-white/20 px-5 py-3 space-y-1.5 max-h-64 overflow-y-auto">
              {contentHistory.map((item) => (
                <button key={item.id} onClick={() => loadFromHistory(item.id as number)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-left group ${currentHistoryId === item.id ? 'bg-accent/10 border border-accent/30' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-dark-100 truncate">{item.brand_name}</p>
                    <p className="text-[11px] text-dark-400 truncate">{item.post_count} posts · {item.platforms}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-dark-400 hidden sm:flex items-center gap-1">
                      <Clock size={10} />{formatDate(item.created_at as string)}
                    </span>
                    <span role="button" onClick={(e) => deleteFromHistory(e, item.id as number)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-dark-400 hover:text-red-400">
                      {deletingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Config Card */}
      <Card className="space-y-5">

        {/* Step 1: Brand */}
        <div>
          <label className="block text-xs font-semibold text-accent uppercase tracking-wider mb-3">1 — Brand</label>

          {/* Source toggle */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => setBrandSource('saved')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                brandSource === 'saved' ? 'bg-accent/15 border-accent/50 text-dark-100' : 'bg-white/10 border-white/20 text-dark-400 hover:bg-white/20 hover:text-dark-200'
              }`}>
              <History size={14} /> Saved Brand
            </button>
            <button onClick={() => setBrandSource('custom')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                brandSource === 'custom' ? 'bg-accent/15 border-accent/50 text-dark-100' : 'bg-white/10 border-white/20 text-dark-400 hover:bg-white/20 hover:text-dark-200'
              }`}>
              <PenLine size={14} /> Any Brand
            </button>
          </div>

          {/* Saved brand picker */}
          {brandSource === 'saved' && (
            <>
              {brandHistory.length === 0 ? (
                <p className="text-sm text-dark-400 bg-white/20 rounded-lg px-4 py-3">
                  No saved brands yet.{' '}
                  <Link href="/tools/brand-generator" className="text-accent hover:underline">Generate a brand first →</Link>
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {brandHistory.map((b) => (
                    <button key={b.id}
                      onClick={() => { setSelectedBrandId(b.id); fetchBrand(b.id); setPosts([]); setCurrentHistoryId(null) }}
                      className={`text-left px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                        selectedBrandId === b.id ? 'bg-accent/15 border-accent/50 text-dark-100' : 'bg-white/20 border-white/30 text-dark-300 hover:bg-white/30'
                      }`}>
                      <p className="text-sm font-semibold truncate">{b.brand_name}</p>
                      <p className="text-[11px] text-dark-400 truncate capitalize">{b.industry} · {formatDate(b.created_at)}</p>
                    </button>
                  ))}
                </div>
              )}
              {brandLoading && <p className="text-xs text-dark-400 mt-2 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Loading…</p>}
            </>
          )}

          {/* Custom brand form */}
          {brandSource === 'custom' && (
            <div className="space-y-3">
              {/* Form / Brief toggle */}
              <div className="flex gap-2">
                <button onClick={() => setCustomMode('form')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    customMode === 'form' ? 'bg-accent/20 text-accent border-accent/50' : 'bg-white/10 text-dark-400 border-white/20 hover:bg-white/20'
                  }`}>
                  <AlignLeft size={11} /> Fill in Details
                </button>
                <button onClick={() => setCustomMode('brief')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    customMode === 'brief' ? 'bg-accent/20 text-accent border-accent/50' : 'bg-white/10 text-dark-400 border-white/20 hover:bg-white/20'
                  }`}>
                  <FileText size={11} /> Paste a Brief
                </button>
              </div>

              {/* Required fields (both modes) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="text" value={customBrandForm.name} placeholder="Brand name *"
                    onChange={(e) => setCustomBrandForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                </div>
                <div>
                  <input
                    type="text" value={customBrandForm.industry} placeholder="Industry *"
                    onChange={(e) => setCustomBrandForm(f => ({ ...f, industry: e.target.value }))}
                    className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                </div>
              </div>

              {/* Fill in details mode */}
              {customMode === 'form' && (
                <div className="space-y-2.5">
                  <input
                    type="text" value={customBrandForm.tagline} placeholder="Tagline (optional)"
                    onChange={(e) => setCustomBrandForm(f => ({ ...f, tagline: e.target.value }))}
                    className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                  <Textarea value={customBrandForm.concept} placeholder="Brand description / concept (optional) — what this brand is about"
                    onChange={(e) => setCustomBrandForm(f => ({ ...f, concept: e.target.value }))}
                    className="!min-h-[64px]" />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text" value={customBrandForm.personality} placeholder="Brand personality (e.g. Bold, Playful)"
                      onChange={(e) => setCustomBrandForm(f => ({ ...f, personality: e.target.value }))}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                    <input
                      type="text" value={customBrandForm.tone} placeholder="Tone of voice (e.g. Warm, Direct)"
                      onChange={(e) => setCustomBrandForm(f => ({ ...f, tone: e.target.value }))}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                  </div>
                  <input
                    type="text" value={customBrandForm.targetAudience} placeholder="Target audience (optional)"
                    onChange={(e) => setCustomBrandForm(f => ({ ...f, targetAudience: e.target.value }))}
                    className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                  <input
                    type="text" value={customBrandForm.values} placeholder="Brand values — comma separated (optional)"
                    onChange={(e) => setCustomBrandForm(f => ({ ...f, values: e.target.value }))}
                    className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text" value={customBrandForm.primaryColors} placeholder="Primary colours — #hex, #hex (optional)"
                      onChange={(e) => setCustomBrandForm(f => ({ ...f, primaryColors: e.target.value }))}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                    <input
                      type="text" value={customBrandForm.secondaryColors} placeholder="Secondary colours — #hex, #hex (optional)"
                      onChange={(e) => setCustomBrandForm(f => ({ ...f, secondaryColors: e.target.value }))}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text" value={customBrandForm.headingFont} placeholder="Heading font (optional)"
                      onChange={(e) => setCustomBrandForm(f => ({ ...f, headingFont: e.target.value }))}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                    <input
                      type="text" value={customBrandForm.bodyFont} placeholder="Body font (optional)"
                      onChange={(e) => setCustomBrandForm(f => ({ ...f, bodyFont: e.target.value }))}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                  </div>
                  <input
                    type="text" value={customBrandForm.imageryStyle} placeholder="Imagery / photography style (optional)"
                    onChange={(e) => setCustomBrandForm(f => ({ ...f, imageryStyle: e.target.value }))}
                    className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                </div>
              )}

              {/* Paste brief mode */}
              {customMode === 'brief' && (
                <Textarea value={customBrandForm.brief}
                  placeholder="Paste your brand brief here — include as much or as little as you have: brand story, values, audience, tone, visual style, colours, etc. The AI will use this to generate contextually relevant content."
                  onChange={(e) => setCustomBrandForm(f => ({ ...f, brief: e.target.value }))}
                  className="!min-h-[140px]" />
              )}
            </div>
          )}

          {/* Active brand confirmation strip */}
          {effectiveBrand && (
            <div className="mt-3 flex items-center gap-2 text-xs text-dark-300 bg-white/20 border border-white/30 rounded-lg px-3 py-2">
              <Check size={13} className="text-green-400 shrink-0" />
              <span>
                <span className="text-dark-100 font-semibold">{effectiveBrand.brand.name}</span>
                {effectiveBrand.brand.tagline ? <> — &ldquo;{effectiveBrand.brand.tagline}&rdquo;</> : null}
              </span>
              {effectiveBrand.visualIdentity.primaryPalette.colors.length > 0 && (
                <div className="flex gap-1 ml-auto shrink-0">
                  {effectiveBrand.visualIdentity.primaryPalette.colors.slice(0, 4).map((c, i) => (
                    <span key={i} className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Count */}
        <div>
          <label className="block text-xs font-semibold text-accent uppercase tracking-wider mb-3">2 — Number of Posts</label>
          <div className="flex flex-wrap gap-2">
            {POST_COUNTS.map((n) => (
              <button key={n} onClick={() => setPostCount(n)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                  postCount === n ? 'bg-accent/20 text-accent border-accent/50' : 'bg-white/20 text-dark-300 border-white/30 hover:bg-white/30'
                }`}>{n}</button>
            ))}
          </div>
        </div>

        {/* Step 3: Format */}
        <div>
          <label className="block text-xs font-semibold text-accent uppercase tracking-wider mb-3">3 — Format</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {FORMAT_OPTIONS.map(({ value, label, desc, icon: Icon }) => (
              <button key={value} onClick={() => setFormatPreference(value)}
                className={`flex flex-col items-start gap-1 px-3 py-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  formatPreference === value ? 'bg-accent/15 border-accent/50 text-dark-100' : 'bg-white/20 border-white/30 text-dark-300 hover:bg-white/30'
                }`}>
                <Icon size={14} className={formatPreference === value ? 'text-accent' : 'text-dark-400'} />
                <span className="text-xs font-semibold leading-tight">{label}</span>
                <span className="text-[10px] text-dark-400 leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Platforms */}
        <div>
          <label className="block text-xs font-semibold text-accent uppercase tracking-wider mb-3">4 — Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(({ value, icon: Icon, active }) => (
              <button key={value} onClick={() => setPlatforms(prev => prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value])}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  platforms.includes(value) ? active : 'bg-white/20 text-dark-400 border-white/30 hover:bg-white/30'
                }`}>
                <Icon size={12} /> {value}
              </button>
            ))}
          </div>
        </div>

        {/* Step 5: Content types */}
        <div>
          <label className="block text-xs font-semibold text-accent uppercase tracking-wider mb-3">5 — Content Types</label>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map(({ value, icon: Icon }) => (
              <button key={value} onClick={() => setContentTypes(prev => prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value])}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  contentTypes.includes(value) ? 'bg-accent/20 text-accent border-accent/50' : 'bg-white/20 text-dark-400 border-white/30 hover:bg-white/30'
                }`}>
                <Icon size={11} /> {value}
              </button>
            ))}
          </div>
        </div>

        {/* Step 6: Campaign Strategy */}
        <div>
          <label className="block text-xs font-semibold text-accent uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Target size={11} /> 6 — Campaign Strategy
          </label>
          <p className="text-[11px] text-dark-400 mb-4">Define the intent behind this content set to sharpen what AI generates.</p>
          <div className="space-y-4">

            {/* Goal */}
            <div>
              <p className="text-xs font-medium text-dark-300 mb-2">What&apos;s the goal?</p>
              <div className="flex flex-wrap gap-2">
                {STRATEGY_GOALS.map(({ value, icon: Icon }) => (
                  <button key={value}
                    onClick={() => setStrategy(s => ({ ...s, goals: s.goals.includes(value) ? s.goals.filter(x => x !== value) : [...s.goals, value] }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      strategy.goals.includes(value) ? 'bg-accent/20 text-accent border-accent/50' : 'bg-white/20 text-dark-400 border-white/30 hover:bg-white/30'
                    }`}>
                    <Icon size={11} /> {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Key Message */}
            <div>
              <p className="text-xs font-medium text-dark-300 mb-1.5">Key message to communicate</p>
              <input type="text" value={strategy.keyMessage}
                onChange={(e) => setStrategy(s => ({ ...s, keyMessage: e.target.value }))}
                placeholder="e.g. Our product saves you 2 hours a day"
                className="w-full bg-white/30 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
            </div>

            {/* CTA */}
            <div>
              <p className="text-xs font-medium text-dark-300 mb-2 flex items-center gap-1"><MousePointerClick size={11} /> Desired audience action</p>
              <div className="flex flex-wrap gap-2">
                {STRATEGY_CTAS.map((value) => (
                  <button key={value}
                    onClick={() => setStrategy(s => ({ ...s, ctas: s.ctas.includes(value) ? s.ctas.filter(x => x !== value) : [...s.ctas, value] }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      strategy.ctas.includes(value) ? 'bg-accent/20 text-accent border-accent/50' : 'bg-white/20 text-dark-400 border-white/30 hover:bg-white/30'
                    }`}>
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <p className="text-xs font-medium text-dark-300 mb-1.5">Campaign theme <span className="text-dark-400 font-normal">(optional)</span></p>
              <input type="text" value={strategy.theme}
                onChange={(e) => setStrategy(s => ({ ...s, theme: e.target.value }))}
                placeholder="e.g. Summer Refresh, Back to Basics, Year-End Gratitude"
                className="w-full bg-white/30 border border-white/30 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent/50" />
            </div>

            {/* Emotion */}
            <div>
              <p className="text-xs font-medium text-dark-300 mb-2">How should this content make people feel?</p>
              <div className="flex flex-wrap gap-2">
                {STRATEGY_EMOTIONS.map((value) => (
                  <button key={value}
                    onClick={() => setStrategy(s => ({ ...s, emotions: s.emotions.includes(value) ? s.emotions.filter(x => x !== value) : [...s.emotions, value] }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      strategy.emotions.includes(value) ? 'bg-accent/20 text-accent border-accent/50' : 'bg-white/20 text-dark-400 border-white/30 hover:bg-white/30'
                    }`}>
                    {value}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Step 7: Notes */}
        <div>
          <label className="block text-xs font-semibold text-accent uppercase tracking-wider mb-2">
            7 — Additional Direction <span className="text-dark-400 normal-case font-normal">(optional)</span>
          </label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. focus on the summer launch, avoid showing faces, warm tones throughout"
            className="!min-h-[64px]" />
        </div>

        {/* Provider + Mode */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-accent uppercase tracking-wider mb-2">
              8 — AI Provider
            </label>
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
                    {!available && <span className="absolute top-1.5 right-1.5 opacity-50 text-[9px]">🔒</span>}
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-[10px] opacity-60">{sub}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-accent uppercase tracking-wider mb-2">
              Generation Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('fast')}
                className={`flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${mode === 'fast' ? 'border-accent bg-accent/15 text-dark-100' : 'border-white/10 bg-white/5 text-dark-400 hover:border-white/20 hover:text-dark-200'}`}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold"><Zap size={12} /> Fast</span>
                <span className="text-[11px] leading-snug opacity-70">
                  {provider === 'claude' ? 'Haiku' : provider === 'gemini' ? 'Flash 2.0' : 'GPT-4o mini'} · ~15s per batch
                </span>
              </button>
              <button
                onClick={() => setMode('quality')}
                className={`flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${mode === 'quality' ? 'border-accent bg-accent/15 text-dark-100' : 'border-white/10 bg-white/5 text-dark-400 hover:border-white/20 hover:text-dark-200'}`}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold"><Sparkles size={12} /> Quality</span>
                <span className="text-[11px] leading-snug opacity-70">
                  {provider === 'claude' ? 'Sonnet 4.6' : provider === 'gemini' ? 'Pro 1.5' : 'GPT-4o'} · ~35s per batch
                </span>
              </button>
            </div>
            {(() => {
              const batchCount = Math.ceil(postCount / 5)
              const batchSize = batchCount > 1 ? 5 : postCount
              const estSecs = mode === 'fast' ? 15 : 35
              return (
                <p className="text-[11px] text-dark-400 mt-2">
                  <span className="text-dark-300 font-medium">{postCount} post{postCount !== 1 ? 's' : ''}</span>
                  {' = '}
                  {batchCount > 1
                    ? <>{batchCount} batches of {batchSize} running in parallel</>
                    : <>1 batch of {batchSize}</>
                  }
                  {' · est. '}
                  <span className="text-dark-300 font-medium">~{estSecs}s</span>
                </p>
              )
            })()}
          </div>
        </div>

        {!aiAvailable && (
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            AI not configured. Add your Anthropic or Gemini API key.
          </p>
        )}
        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <Button onClick={handleGenerate} disabled={!canGenerate} className="flex-1">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Generating {postCount} posts…</> : <><Sparkles size={16} /> Generate {postCount} Posts</>}
          </Button>
          {posts.length > 0 && (
            <Button variant="secondary" onClick={() => { setPosts([]); setCurrentHistoryId(null) }}>
              <RefreshCw size={16} /> Clear
            </Button>
          )}
        </div>

        {loading && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-dark-400">
              <span className="text-dark-300">
                {elapsed < 5 ? `Running ${Math.ceil(postCount / 5)} batch${Math.ceil(postCount / 5) > 1 ? 'es' : ''} in parallel...` : elapsed < 20 ? `Writing ${postCount} posts across ${platforms.length} platform${platforms.length > 1 ? 's' : ''}...` : elapsed < 32 ? 'Crafting visual directions...' : 'Almost there...'}
              </span>
              <span className={`tabular-nums text-xs font-medium ${mode === 'fast' ? 'text-emerald-400' : 'text-accent'}`}>
                {mode === 'fast' ? <Zap size={10} className="inline mr-0.5" /> : <Sparkles size={10} className="inline mr-0.5" />}
                {elapsed}s
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${Math.min((elapsed / (mode === 'fast' ? 18 : 38)) * 100, 95)}%`,
                  background: mode === 'fast' ? '#10b981' : '#6366f1',
                }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Results */}
      {posts.length > 0 && (
        <div ref={resultsRef} className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-medium text-dark-300">
              {posts.length} posts for <span className="text-dark-100">{effectiveBrand?.brand.name}</span>
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setAllVisualOpen(v => !v)}
                className="text-xs text-dark-400 hover:text-dark-100 transition-colors px-3 py-1.5 rounded-lg bg-white/30 border border-white/40 cursor-pointer flex items-center gap-1.5">
                <Palette size={12} /> {allVisualOpen ? 'Collapse' : 'Expand'} Visuals
              </button>
              <button onClick={handleDownloadPDF} disabled={pdfLoading}
                className="text-xs text-dark-400 hover:text-dark-100 transition-colors px-3 py-1.5 rounded-lg bg-white/30 border border-white/40 cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                {pdfLoading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                {pdfLoading ? 'Generating…' : 'Download PDF'}
              </button>
              <button onClick={handleCopyAll}
                className="text-xs text-dark-400 hover:text-dark-100 transition-colors px-3 py-1.5 rounded-lg bg-white/30 border border-white/40 cursor-pointer flex items-center gap-1.5">
                <Copy size={12} /> Copy All
              </button>
            </div>
          </div>

          {/* Brand palette reference */}
          {effectiveBrand && (effectiveBrand.visualIdentity.primaryPalette.colors.length > 0 || effectiveBrand.visualIdentity.secondaryPalette.colors.length > 0) && (
            <Card className="!p-3 flex flex-wrap items-center gap-4">
              {effectiveBrand.visualIdentity.primaryPalette.colors.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-dark-400 uppercase tracking-wider">Primary</span>
                  <div className="flex gap-1">
                    {effectiveBrand.visualIdentity.primaryPalette.colors.map((c, i) => (
                      <span key={i} className="w-5 h-5 rounded border border-white/20" style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>
              )}
              {effectiveBrand.visualIdentity.secondaryPalette.colors.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-dark-400 uppercase tracking-wider">Secondary</span>
                  <div className="flex gap-1">
                    {effectiveBrand.visualIdentity.secondaryPalette.colors.map((c, i) => (
                      <span key={i} className="w-5 h-5 rounded border border-white/20" style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>
              )}
              <span className="text-[10px] text-dark-400 ml-auto flex items-center gap-1.5">
                <a
                  href={`https://fonts.google.com/download?family=${encodeURIComponent(effectiveBrand.visualIdentity.typography.heading)}`}
                  target="_blank" rel="noopener noreferrer"
                  title="Download heading font"
                  className="flex items-center gap-0.5 text-dark-200 hover:text-accent transition-colors"
                >
                  {effectiveBrand.visualIdentity.typography.heading} <Download size={10} />
                </a>
                <span>+</span>
                <a
                  href={`https://fonts.google.com/download?family=${encodeURIComponent(effectiveBrand.visualIdentity.typography.body)}`}
                  target="_blank" rel="noopener noreferrer"
                  title="Download body font"
                  className="flex items-center gap-0.5 hover:text-accent transition-colors"
                >
                  {effectiveBrand.visualIdentity.typography.body} <Download size={10} />
                </a>
              </span>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} platforms={platforms} brand={effectiveBrand!} forceVisualOpen={allVisualOpen} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
