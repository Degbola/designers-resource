'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function TypographyConverter() {
  const [value, setValue] = useState(16)
  const [unit, setUnit] = useState('px')
  const [baseFontSize, setBaseFontSize] = useState(16)

  const toPx = (): number => {
    switch (unit) {
      case 'px': return value
      case 'rem': return value * baseFontSize
      case 'em': return value * baseFontSize
      case 'pt': return value * (96 / 72)
      default: return value
    }
  }

  const px = toPx()

  const conversions = [
    { label: 'Pixels (px)', value: px, unit: 'px' },
    { label: 'REM', value: px / baseFontSize, unit: 'rem' },
    { label: 'EM', value: px / baseFontSize, unit: 'em' },
    { label: 'Points (pt)', value: px * (72 / 96), unit: 'pt' },
  ]

  const units = ['px', 'rem', 'em', 'pt']

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input label="Value" type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
        </div>
        <div className="flex gap-1 pb-[1px]">
          {units.map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${u === unit ? 'bg-accent text-white' : 'bg-black/[0.05] dark:bg-white/[0.05] text-dark-300 hover:bg-white/60 dark:hover:bg-white/[0.06]'}`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-dark-400 whitespace-nowrap">Base font size:</span>
        <input
          type="number"
          value={baseFontSize}
          onChange={(e) => setBaseFontSize(Number(e.target.value) || 16)}
          className="bg-white/60 dark:bg-white/[0.06] border border-black/[0.07] dark:border-white/[0.08] rounded px-2 py-1 text-sm text-dark-100 w-16 focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
        <span className="text-xs text-dark-400">px</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {conversions.map((c) => (
          <div key={c.unit} className={`bg-white/60 dark:bg-white/[0.06] rounded-lg p-3 ${c.unit === unit ? 'ring-2 ring-accent/50' : ''}`}>
            <p className="text-xs text-dark-400 mb-1">{c.label}</p>
            <p className="text-lg font-mono text-dark-100">{Number(c.value.toFixed(4))}<span className="text-dark-400 text-sm ml-1">{c.unit}</span></p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ViewportConverter() {
  const [value, setValue] = useState(100)
  const [unit, setUnit] = useState('px')
  const [viewportWidth, setViewportWidth] = useState(1920)
  const [viewportHeight, setViewportHeight] = useState(1080)

  const toPx = (): number => {
    switch (unit) {
      case 'px': return value
      case 'vw': return (value / 100) * viewportWidth
      case 'vh': return (value / 100) * viewportHeight
      case '%': return (value / 100) * viewportWidth
      default: return value
    }
  }

  const px = toPx()

  const conversions = [
    { label: 'Pixels (px)', value: px, unit: 'px' },
    { label: 'Viewport Width (vw)', value: (px / viewportWidth) * 100, unit: 'vw' },
    { label: 'Viewport Height (vh)', value: (px / viewportHeight) * 100, unit: 'vh' },
    { label: 'Percentage (%)', value: (px / viewportWidth) * 100, unit: '%' },
  ]

  const units = ['px', 'vw', 'vh', '%']

  const presets = [
    { label: 'Mobile', w: 375, h: 812 },
    { label: 'Tablet', w: 768, h: 1024 },
    { label: 'Laptop', w: 1366, h: 768 },
    { label: 'Desktop', w: 1920, h: 1080 },
    { label: '4K', w: 3840, h: 2160 },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input label="Value" type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
        </div>
        <div className="flex gap-1 pb-[1px]">
          {units.map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${u === unit ? 'bg-accent text-white' : 'bg-black/[0.05] dark:bg-white/[0.05] text-dark-300 hover:bg-white/60 dark:hover:bg-white/[0.06]'}`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-400">Viewport:</span>
          <input type="number" value={viewportWidth} onChange={(e) => setViewportWidth(Number(e.target.value))} className="bg-white/60 dark:bg-white/[0.06] border border-black/[0.07] dark:border-white/[0.08] rounded px-2 py-1 text-sm text-dark-100 w-20 focus:outline-none focus:ring-1 focus:ring-accent/50" />
          <span className="text-xs text-dark-400">x</span>
          <input type="number" value={viewportHeight} onChange={(e) => setViewportHeight(Number(e.target.value))} className="bg-white/60 dark:bg-white/[0.06] border border-black/[0.07] dark:border-white/[0.08] rounded px-2 py-1 text-sm text-dark-100 w-20 focus:outline-none focus:ring-1 focus:ring-accent/50" />
        </div>
        <div className="flex gap-1">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => { setViewportWidth(p.w); setViewportHeight(p.h) }}
              className="text-xs bg-black/[0.05] dark:bg-white/[0.05] hover:bg-white/60 dark:hover:bg-white/[0.06] text-dark-300 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {conversions.map((c) => (
          <div key={c.unit} className={`bg-white/60 dark:bg-white/[0.06] rounded-lg p-3 ${c.unit === unit ? 'ring-2 ring-accent/50' : ''}`}>
            <p className="text-xs text-dark-400 mb-1">{c.label}</p>
            <p className="text-lg font-mono text-dark-100">{Number(c.value.toFixed(4))}<span className="text-dark-400 text-sm ml-1">{c.unit}</span></p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SpacingConverter() {
  const [value, setValue] = useState(16)
  const [unit, setUnit] = useState('px')
  const [baseFontSize, setBaseFontSize] = useState(16)
  const [parentSize, setParentSize] = useState(1200)

  const toPx = (): number => {
    switch (unit) {
      case 'px': return value
      case 'rem': return value * baseFontSize
      case '%': return (value / 100) * parentSize
      default: return value
    }
  }

  const px = toPx()

  const conversions = [
    { label: 'Pixels (px)', value: px, unit: 'px' },
    { label: 'REM', value: px / baseFontSize, unit: 'rem' },
    { label: 'Percentage (%)', value: (px / parentSize) * 100, unit: '%' },
  ]

  const units = ['px', 'rem', '%']

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input label="Value" type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
        </div>
        <div className="flex gap-1 pb-[1px]">
          {units.map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${u === unit ? 'bg-accent text-white' : 'bg-black/[0.05] dark:bg-white/[0.05] text-dark-300 hover:bg-white/60 dark:hover:bg-white/[0.06]'}`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-400 whitespace-nowrap">Base font:</span>
          <input type="number" value={baseFontSize} onChange={(e) => setBaseFontSize(Number(e.target.value) || 16)} className="bg-white/60 dark:bg-white/[0.06] border border-black/[0.07] dark:border-white/[0.08] rounded px-2 py-1 text-sm text-dark-100 w-16 focus:outline-none focus:ring-1 focus:ring-accent/50" />
          <span className="text-xs text-dark-400">px</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-400 whitespace-nowrap">Parent:</span>
          <input type="number" value={parentSize} onChange={(e) => setParentSize(Number(e.target.value) || 1200)} className="bg-white/60 dark:bg-white/[0.06] border border-black/[0.07] dark:border-white/[0.08] rounded px-2 py-1 text-sm text-dark-100 w-20 focus:outline-none focus:ring-1 focus:ring-accent/50" />
          <span className="text-xs text-dark-400">px</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {conversions.map((c) => (
          <div key={c.unit} className={`bg-white/60 dark:bg-white/[0.06] rounded-lg p-3 ${c.unit === unit ? 'ring-2 ring-accent/50' : ''}`}>
            <p className="text-xs text-dark-400 mb-1">{c.label}</p>
            <p className="text-lg font-mono text-dark-100">{Number(c.value.toFixed(4))}<span className="text-dark-400 text-sm ml-1">{c.unit}</span></p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function UnitConverterPage() {
  const tabs = [
    { id: 'typography', label: 'Typography', content: <TypographyConverter /> },
    { id: 'viewport', label: 'Viewport', content: <ViewportConverter /> },
    { id: 'spacing', label: 'Spacing', content: <SpacingConverter /> },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-dark-100 transition-colors">
        <ArrowLeft size={16} /> Back to Tools
      </Link>
      <Card>
        <h2 className="text-lg font-semibold text-dark-100 mb-6">Unit Converter</h2>
        <Tabs tabs={tabs} />
      </Card>
    </div>
  )
}
