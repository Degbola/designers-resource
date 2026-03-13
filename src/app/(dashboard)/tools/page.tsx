'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Palette, Ruler, Type, Sparkles, ArrowRight, Copy, Check, Wand2 } from 'lucide-react'
import Link from 'next/link'

const TOOLS = [
  { name: 'Color Palette', description: 'Generate harmonious color palettes, explore shades and tints, and export CSS variables.', href: '/tools/colors', icon: Palette, color: 'text-green-400', bg: 'bg-green-500/20' },
  { name: 'Unit Converter', description: 'Convert between px, rem, em, pt, and viewport units for responsive design.', href: '/tools/converter', icon: Ruler, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { name: 'Font Pairing', description: 'Explore curated font pairings with live preview for your design projects.', href: '/tools/fonts', icon: Type, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  { name: 'Visual Identity', description: 'Build brand strategy from questionnaires and get AI-powered color palette and typography suggestions.', href: '/tools/brief', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { name: 'Brand Generator', description: 'Generate complete fictional brands with strategy and visual identity — perfect for passion projects.', href: '/tools/brand-generator', icon: Wand2, color: 'text-purple-400', bg: 'bg-purple-500/20' },
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
      <h3 className="font-semibold text-dark-100 mb-4">Aspect Ratio Calculator</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Input label="Width" type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
        <Input label="Height" type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
      </div>
      <p className="text-sm text-dark-300 mb-3">Ratio: <span className="text-dark-100 font-semibold">{ratioW}:{ratioH}</span></p>
      <div className="space-y-1">
        {commonRatios.map((r) => (
          <button key={r.label} onClick={() => { setWidth(r.w * 100); setHeight(r.h * 100) }}
            className="text-xs bg-white/30 hover:bg-white/40 text-dark-200 px-2.5 py-1 rounded mr-2 transition-colors cursor-pointer">
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
        <h3 className="font-semibold text-dark-100">Lorem Ipsum Generator</h3>
        <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors cursor-pointer">
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
        </button>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm text-dark-300">Paragraphs:</label>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setParagraphs(n)}
            className={`w-7 h-7 rounded text-xs font-medium cursor-pointer transition-colors ${n === paragraphs ? 'bg-accent text-white' : 'bg-white/30 text-dark-300 hover:bg-white/40'}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="bg-white/30 rounded-lg p-3 max-h-40 overflow-y-auto text-sm text-dark-300 leading-relaxed whitespace-pre-line">{text}</div>
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
      <h3 className="font-semibold text-dark-100 mb-4">Contrast Checker</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs text-dark-400 mb-1">Foreground</label>
          <div className="flex items-center gap-2">
            <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
            <input type="text" value={fg} onChange={(e) => setFg(e.target.value)} className="bg-white/40 border border-white/30 rounded px-2 py-1 text-sm text-dark-100 w-24 focus:outline-none focus:ring-1 focus:ring-accent/50" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-dark-400 mb-1">Background</label>
          <div className="flex items-center gap-2">
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
            <input type="text" value={bg} onChange={(e) => setBg(e.target.value)} className="bg-white/40 border border-white/30 rounded px-2 py-1 text-sm text-dark-100 w-24 focus:outline-none focus:ring-1 focus:ring-accent/50" />
          </div>
        </div>
      </div>
      <div className="rounded-lg p-4 mb-4 text-center" style={{ backgroundColor: bg, color: fg }}>
        <p className="text-lg font-bold">Sample Text</p>
        <p className="text-sm">The quick brown fox jumps over the lazy dog</p>
      </div>
      <div className="text-center mb-3">
        <span className="text-2xl font-bold text-dark-100">{ratio.toFixed(2)}</span>
        <span className="text-sm text-dark-400 ml-1">: 1</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={`rounded p-2 text-center ${aaNormal ? 'bg-green-500/20 text-green-400' : 'bg-red-50/80 text-red-500'}`}>AA Normal: {aaNormal ? 'Pass' : 'Fail'}</div>
        <div className={`rounded p-2 text-center ${aaLarge ? 'bg-green-500/20 text-green-400' : 'bg-red-50/80 text-red-500'}`}>AA Large: {aaLarge ? 'Pass' : 'Fail'}</div>
        <div className={`rounded p-2 text-center ${aaaNormal ? 'bg-green-500/20 text-green-400' : 'bg-red-50/80 text-red-500'}`}>AAA Normal: {aaaNormal ? 'Pass' : 'Fail'}</div>
        <div className={`rounded p-2 text-center ${aaaLarge ? 'bg-green-500/20 text-green-400' : 'bg-red-50/80 text-red-500'}`}>AAA Large: {aaaLarge ? 'Pass' : 'Fail'}</div>
      </div>
    </Card>
  )
}

export default function ToolsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-dark-100 mb-4">Design Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <Link key={tool.href} href={tool.href}>
                <Card className="hover:border-white/60 transition-colors group h-full">
                  <div className={`w-10 h-10 rounded-lg ${tool.bg} flex items-center justify-center mb-3`}>
                    <Icon size={20} className={tool.color} />
                  </div>
                  <h3 className="font-semibold text-dark-100 mb-1 group-hover:text-accent transition-colors">{tool.name}</h3>
                  <p className="text-sm text-dark-300 mb-3">{tool.description}</p>
                  <span className="text-sm text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
                    Open <ArrowRight size={14} />
                  </span>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-dark-100 mb-4">Quick Utilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AspectRatioCalculator />
          <LoremIpsumGenerator />
          <ContrastChecker />
        </div>
      </div>
    </div>
  )
}
