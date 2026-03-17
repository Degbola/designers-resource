'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Palette, Ruler, Type, Sparkles, ArrowRight, Copy, Check, Wand2, LayoutGrid } from 'lucide-react'
import Link from 'next/link'

const TOOLS = [
  { name: 'Color Palette', description: 'Generate harmonious color palettes, explore shades and tints, and export CSS variables.', href: '/tools/colors', icon: Palette },
  { name: 'Unit Converter', description: 'Convert between px, rem, em, pt, and viewport units for responsive design.', href: '/tools/converter', icon: Ruler },
  { name: 'Font Pairing', description: 'Explore curated font pairings with live preview for your design projects.', href: '/tools/fonts', icon: Type },
  { name: 'Visual Identity', description: 'Build brand strategy from questionnaires and get AI-powered color palette and typography suggestions.', href: '/tools/brief', icon: Sparkles },
  { name: 'Brand Generator', description: 'Generate complete fictional brands with strategy and visual identity — perfect for passion projects.', href: '/tools/brand-generator', icon: Wand2 },
  { name: 'Social Content', description: 'Generate on-brand captions and detailed visual direction for social media designs across any platform.', href: '/tools/social-content', icon: LayoutGrid },
]

const LOREM = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.',
  'Nulla facilisi. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec ullamcorper nulla non metus auctor fringilla. Vestibulum id ligula porta felis euismod semper.',
  'Maecenas sed diam eget risus varius blandit sit amet non magna. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Cras mattis consectetur purus sit amet fermentum.',
  'Aenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Nullam quis risus eget urna.',
]

function getLuminance(hex: string): number {
  const rgb = hex.replace('#', '').match(/.{2}/g)?.map((c) => {
    const v = parseInt(c, 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }) || [0, 0, 0]
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function AspectRatioCalculator() {
  const [width, setWidth] = useState(1920)
  const [height, setHeight] = useState(1080)

  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const d = gcd(width, height)
  const ratioW = d ? width / d : 0
  const ratioH = d ? height / d : 0

  const commonRatios = [
    { label: '16:9', w: 16, h: 9 },
    { label: '4:3', w: 4, h: 3 },
    { label: '1:1', w: 1, h: 1 },
    { label: '21:9', w: 21, h: 9 },
    { label: '3:2', w: 3, h: 2 },
  ]

  return (
    <Card>
      <h3 className="font-serif text-base font-normal text-dark-100 mb-4">Aspect Ratio Calculator</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Input label="Width" type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
        <Input label="Height" type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
      </div>
      <p className="text-sm text-dark-300 mb-3">Ratio: <span className="text-dark-100 font-semibold">{ratioW}:{ratioH}</span></p>
      <div className="flex flex-wrap gap-1.5">
        {commonRatios.map((r) => (
          <button
            key={r.label}
            onClick={() => { setWidth(r.w * 100); setHeight(r.h * 100) }}
            className="text-[10px] font-display border border-dark-600 dark:border-[rgba(255,255,255,0.08)] text-dark-300 hover:border-accent/50 hover:text-accent px-2.5 py-1 transition-colors cursor-pointer"
          >
            {r.label}
          </button>
        ))}
      </div>
    </Card>
  )
}

function LoremIpsumGenerator() {
  const [paragraphs, setParagraphs] = useState(2)
  const [copied, setCopied] = useState(false)

  const text = LOREM.slice(0, paragraphs).join('\n\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-base font-normal text-dark-100">Lorem Ipsum</h3>
        <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-accent hover:text-accent-hover transition-colors cursor-pointer">
          {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
        </button>
      </div>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[10px] font-display text-dark-400 uppercase tracking-[0.06em] mr-1">Paragraphs</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setParagraphs(n)}
            className={`w-7 h-7 text-[11px] font-display font-semibold cursor-pointer transition-colors ${n === paragraphs ? 'bg-accent text-white' : 'border border-dark-600 dark:border-[rgba(255,255,255,0.08)] text-dark-300 hover:border-accent/50 hover:text-accent'}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="border border-dark-600 dark:border-[rgba(255,255,255,0.08)] p-3 max-h-40 overflow-y-auto text-sm text-dark-300 leading-relaxed whitespace-pre-line">{text}</div>
    </Card>
  )
}

function ContrastChecker() {
  const [fg, setFg] = useState('#ffffff')
  const [bg, setBg] = useState('#1a1a2e')

  const ratio = getContrastRatio(fg, bg)
  const aaLarge = ratio >= 3
  const aaNormal = ratio >= 4.5
  const aaaLarge = ratio >= 4.5
  const aaaNormal = ratio >= 7

  return (
    <Card>
      <h3 className="font-serif text-base font-normal text-dark-100 mb-4">Contrast Checker</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-300 mb-1.5">Foreground</label>
          <div className="flex items-center gap-2">
            <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-8 h-8 cursor-pointer border-0 bg-transparent" />
            <input
              type="text"
              value={fg}
              onChange={(e) => setFg(e.target.value)}
              className="bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded px-2 py-[7px] text-[13px] font-display text-dark-100 w-24 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-300 mb-1.5">Background</label>
          <div className="flex items-center gap-2">
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-8 h-8 cursor-pointer border-0 bg-transparent" />
            <input
              type="text"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] rounded px-2 py-[7px] text-[13px] font-display text-dark-100 w-24 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>
      </div>
      <div className="p-4 mb-4 text-center border border-dark-600 dark:border-[rgba(255,255,255,0.08)]" style={{ backgroundColor: bg, color: fg }}>
        <p className="text-lg font-bold">Sample Text</p>
        <p className="text-sm">The quick brown fox jumps over the lazy dog</p>
      </div>
      <div className="text-center mb-3">
        <span className="font-serif text-2xl text-dark-100">{ratio.toFixed(2)}</span>
        <span className="text-sm text-dark-400 ml-1">: 1</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] font-display font-semibold uppercase tracking-[0.06em]">
        <div className={`p-2 text-center border ${aaNormal ? 'border-accent/40 text-accent bg-dark-700' : 'border-red-300/40 text-red-500 bg-red-50/40 dark:bg-transparent dark:border-red-500/20'}`}>AA Normal: {aaNormal ? 'Pass' : 'Fail'}</div>
        <div className={`p-2 text-center border ${aaLarge ? 'border-accent/40 text-accent bg-dark-700' : 'border-red-300/40 text-red-500 bg-red-50/40 dark:bg-transparent dark:border-red-500/20'}`}>AA Large: {aaLarge ? 'Pass' : 'Fail'}</div>
        <div className={`p-2 text-center border ${aaaNormal ? 'border-accent/40 text-accent bg-dark-700' : 'border-red-300/40 text-red-500 bg-red-50/40 dark:bg-transparent dark:border-red-500/20'}`}>AAA Normal: {aaaNormal ? 'Pass' : 'Fail'}</div>
        <div className={`p-2 text-center border ${aaaLarge ? 'border-accent/40 text-accent bg-dark-700' : 'border-red-300/40 text-red-500 bg-red-50/40 dark:bg-transparent dark:border-red-500/20'}`}>AAA Large: {aaaLarge ? 'Pass' : 'Fail'}</div>
      </div>
    </Card>
  )
}

export default function ToolsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="font-serif text-lg font-normal text-dark-100 mb-4">Design Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <Link key={tool.href} href={tool.href}>
                <Card className="hover:border-accent/40 hover:bg-dark-700 transition-all duration-200 group h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Icon size={16} className="text-dark-400 group-hover:text-accent transition-colors mt-0.5" />
                    <ArrowRight size={14} className="text-dark-500 group-hover:text-accent transition-all duration-200 group-hover:translate-x-0.5" />
                  </div>
                  <h3 className="font-medium text-dark-100 mb-1.5 text-sm group-hover:text-accent transition-colors">{tool.name}</h3>
                  <p className="text-sm text-dark-300 leading-relaxed">{tool.description}</p>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="font-serif text-lg font-normal text-dark-100 mb-4">Quick Utilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AspectRatioCalculator />
          <LoremIpsumGenerator />
          <ContrastChecker />
        </div>
      </div>
    </div>
  )
}
