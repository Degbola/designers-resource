'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { ArrowLeft, Sparkles, Copy, Check, Loader2, Zap } from 'lucide-react'
import Link from 'next/link'
import { analyzeBrief } from '@/lib/brief-engine'
import type { BriefInput, BriefResult, PaletteSuggestion, FontSuggestion } from '@/lib/brief-engine'

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

function getLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const rgb = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  const vals = rgb.map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
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
          <h4 className="text-sm font-semibold text-white mb-1">{palette.name}</h4>
          <p className="text-xs text-dark-400 mb-3">{palette.rationale}</p>
          <div className="flex gap-2 h-20">
            {palette.colors.map((color, j) => (
              <button
                key={j}
                onClick={() => copyColor(color)}
                className="flex-1 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: color, color: textColorForBg(color) }}
              >
                <span className="font-mono text-xs font-bold">{color.toUpperCase()}</span>
                <span className="text-[10px] opacity-70">
                  {copiedColor === color ? 'Copied!' : 'Click to copy'}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FontDisplay({ fonts }: { fonts: FontSuggestion[] }) {
  useEffect(() => {
    fonts.forEach((f) => {
      loadGoogleFont(f.heading, f.headingWeight)
      loadGoogleFont(f.body, f.bodyWeight)
    })
  }, [fonts])

  return (
    <div className="space-y-4">
      {fonts.map((font, i) => (
        <Card key={i} className="!bg-dark-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-dark-600 text-dark-300 px-2 py-0.5 rounded">{font.category}</span>
          </div>
          <div className="bg-dark-700 rounded-lg p-4 mb-3">
            <h3
              className="text-2xl text-white mb-2"
              style={{ fontFamily: `'${font.heading}', serif`, fontWeight: font.headingWeight }}
            >
              {font.heading}
            </h3>
            <p
              className="text-sm text-dark-300 leading-relaxed"
              style={{ fontFamily: `'${font.body}', sans-serif`, fontWeight: font.bodyWeight }}
            >
              Great design speaks to the heart of your audience. This pairing brings clarity and character to every touchpoint.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs mb-2">
            <div>
              <p className="text-dark-400">Heading: <span className="text-white">{font.heading}</span> ({font.headingWeight})</p>
            </div>
            <div>
              <p className="text-dark-400">Body: <span className="text-white">{font.body}</span> ({font.bodyWeight})</p>
            </div>
          </div>
          <p className="text-xs text-dark-400">{font.rationale}</p>
        </Card>
      ))}
    </div>
  )
}

export default function DesignBriefPage() {
  const [form, setForm] = useState<BriefInput>({
    brandName: '',
    industry: 'tech',
    moods: [],
    targetAudience: '',
    description: '',
    brandColors: [],
  })
  const [colorInput, setColorInput] = useState('#6366f1')
  const [result, setResult] = useState<BriefResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(false)
  const [useAi, setUseAi] = useState(false)
  const [aiUsed, setAiUsed] = useState(false)

  useEffect(() => {
    fetch('/api/brief/analyze').then(r => r.json()).then(d => {
      setAiAvailable(d.available)
      if (d.available) setUseAi(true)
    }).catch(() => {})
  }, [])

  const toggleMood = (mood: string) => {
    setForm(prev => ({
      ...prev,
      moods: prev.moods.includes(mood)
        ? prev.moods.filter(m => m !== mood)
        : [...prev.moods, mood],
    }))
  }

  const addBrandColor = () => {
    if (colorInput && !form.brandColors?.includes(colorInput)) {
      setForm(prev => ({ ...prev, brandColors: [...(prev.brandColors || []), colorInput] }))
    }
  }

  const removeBrandColor = (color: string) => {
    setForm(prev => ({ ...prev, brandColors: prev.brandColors?.filter(c => c !== color) || [] }))
  }

  const handleAnalyze = async () => {
    setLoading(true)
    setAiUsed(false)

    // Always generate rule-based results first
    const ruleResult = analyzeBrief(form)

    if (useAi && aiAvailable) {
      try {
        const res = await fetch('/api/brief/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (data.available && data.result && !data.error) {
          setResult(data.result)
          setAiUsed(true)
          setLoading(false)
          return
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
      <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Tools
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brief Form */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles size={20} className="text-accent" /> Design Brief
            </h3>
            {aiAvailable && (
              <button
                onClick={() => setUseAi(!useAi)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${useAi ? 'bg-accent/20 text-accent border border-accent/50' : 'bg-dark-600 text-dark-400 border border-dark-600'}`}
              >
                <Zap size={12} /> AI Enhanced
              </button>
            )}
          </div>

          <div className="space-y-4">
            <Input
              label="Brand Name"
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              placeholder="e.g. Seysey Studios"
            />

            <Select
              label="Industry"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              options={INDUSTRIES}
            />

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Mood / Vibe</label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => toggleMood(mood)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer ${
                      form.moods.includes(mood)
                        ? 'bg-accent/20 text-accent border border-accent/50'
                        : 'bg-dark-600 text-dark-300 border border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Target Audience"
              value={form.targetAudience}
              onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
              placeholder="e.g. Young professionals, ages 25-35"
            />

            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the brand, its values, what makes it unique..."
            />

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Brand Colors (optional)</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="bg-dark-700 border border-dark-600 rounded px-2 py-1.5 text-sm text-white font-mono w-24 focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
                <Button variant="secondary" size="sm" onClick={addBrandColor}>Add</Button>
              </div>
              {form.brandColors && form.brandColors.length > 0 && (
                <div className="flex gap-2">
                  {form.brandColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => removeBrandColor(color)}
                      className="w-8 h-8 rounded-lg cursor-pointer hover:scale-110 transition-transform relative group"
                      style={{ backgroundColor: color }}
                      title={`${color} - click to remove`}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: textColorForBg(color) }}>x</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleAnalyze} disabled={loading} className="w-full">
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles size={16} /> Analyze Brief</>
              )}
            </Button>
          </div>
        </Card>

        {/* Results */}
        <div>
          {result ? (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-white">Results</h3>
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
    </div>
  )
}
