'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check, Trash2, Download, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255)
}

function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function textColorForBg(hex: string): string {
  return getLuminance(hex) > 0.4 ? '#000000' : '#ffffff'
}

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'split-complementary' | 'monochromatic'

function generateHarmony(hex: string, type: HarmonyType): string[] {
  const [h, s, l] = hexToHsl(hex)
  switch (type) {
    case 'complementary': return [hex, hslToHex((h + 180) % 360, s, l)]
    case 'analogous': return [hslToHex((h - 30 + 360) % 360, s, l), hex, hslToHex((h + 30) % 360, s, l)]
    case 'triadic': return [hex, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)]
    case 'tetradic': return [hex, hslToHex((h + 90) % 360, s, l), hslToHex((h + 180) % 360, s, l), hslToHex((h + 270) % 360, s, l)]
    case 'split-complementary': return [hex, hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)]
    case 'monochromatic': return [hslToHex(h, s, Math.max(l - 30, 10)), hslToHex(h, s, Math.max(l - 15, 10)), hex, hslToHex(h, s, Math.min(l + 15, 95)), hslToHex(h, s, Math.min(l + 30, 95))]
  }
}

function generateShades(hex: string, count: number = 9): string[] {
  const [h, s, l] = hexToHsl(hex)
  return Array.from({ length: count }, (_, i) => {
    const newL = Math.round(95 - (i * 85) / (count - 1))
    return hslToHex(h, s, newL)
  })
}

const HARMONY_TYPES: { value: HarmonyType; label: string }[] = [
  { value: 'analogous', label: 'Analogous' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'triadic', label: 'Triadic' },
  { value: 'tetradic', label: 'Tetradic' },
  { value: 'split-complementary', label: 'Split Comp.' },
  { value: 'monochromatic', label: 'Monochromatic' },
]

export default function ColorPalettePage() {
  const [baseColor, setBaseColor] = useState('#6366f1')
  const [harmonyType, setHarmonyType] = useState<HarmonyType>('analogous')
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  const [savedPalettes, setSavedPalettes] = useState<string[][]>([])
  const [hexInput, setHexInput] = useState('#6366f1')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dr-saved-palettes')
      if (saved) setSavedPalettes(JSON.parse(saved))
    } catch {}
  }, [])

  const savePalettes = useCallback((palettes: string[][]) => {
    setSavedPalettes(palettes)
    localStorage.setItem('dr-saved-palettes', JSON.stringify(palettes))
  }, [])

  const palette = generateHarmony(baseColor, harmonyType)
  const shades = generateShades(baseColor)
  const [r, g, b] = hexToRgb(baseColor)
  const [h, s, l] = hexToHsl(baseColor)

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color)
    setCopiedColor(color)
    setTimeout(() => setCopiedColor(null), 1500)
  }

  const handleHexInput = (val: string) => {
    setHexInput(val)
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      setBaseColor(val)
    }
  }

  const exportCSS = () => {
    const css = palette.map((c, i) => `  --palette-${i + 1}: ${c};`).join('\n')
    const full = `:root {\n${css}\n}`
    navigator.clipboard.writeText(full)
    setCopiedColor('css')
    setTimeout(() => setCopiedColor(null), 1500)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Tools
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Color Picker */}
        <Card>
          <h3 className="font-semibold text-white mb-4">Base Color</h3>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="color"
              value={baseColor}
              onChange={(e) => { setBaseColor(e.target.value); setHexInput(e.target.value) }}
              className="w-16 h-16 rounded-lg cursor-pointer border-2 border-dark-600 bg-transparent"
            />
            <div className="flex-1">
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexInput(e.target.value)}
                className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white font-mono w-full mb-2 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <div className="text-xs text-dark-400 space-y-0.5">
                <p>RGB: {r}, {g}, {b}</p>
                <p>HSL: {h}, {s}%, {l}%</p>
              </div>
            </div>
          </div>
          <div className="w-full h-20 rounded-lg" style={{ backgroundColor: baseColor }} />
        </Card>

        {/* Harmony Type */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Color Harmony</h3>
            <div className="flex gap-1">
              <Button variant="secondary" size="sm" onClick={exportCSS}>
                {copiedColor === 'css' ? <><Check size={14} /> Copied CSS</> : <><Download size={14} /> Export CSS</>}
              </Button>
              <Button size="sm" onClick={() => savePalettes([...savedPalettes, palette])}>
                <Plus size={14} /> Save
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {HARMONY_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setHarmonyType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${harmonyType === t.value ? 'bg-accent text-white' : 'bg-dark-600 text-dark-300 hover:bg-dark-500'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 h-32">
            {palette.map((color, i) => (
              <button
                key={i}
                onClick={() => copyColor(color)}
                className="flex-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105 cursor-pointer relative group"
                style={{ backgroundColor: color, color: textColorForBg(color) }}
              >
                <span className="font-mono text-sm font-bold">{color.toUpperCase()}</span>
                <span className="text-xs opacity-70">
                  {copiedColor === color ? 'Copied!' : 'Click to copy'}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Shades */}
      <Card>
        <h3 className="font-semibold text-white mb-4">Shades & Tints</h3>
        <div className="flex gap-1 h-20">
          {shades.map((color, i) => (
            <button
              key={i}
              onClick={() => copyColor(color)}
              className="flex-1 rounded flex items-end justify-center pb-2 cursor-pointer hover:scale-y-110 transition-transform origin-bottom"
              style={{ backgroundColor: color, color: textColorForBg(color) }}
            >
              <span className="font-mono text-[10px]">{copiedColor === color ? 'Copied!' : color.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Saved Palettes */}
      {savedPalettes.length > 0 && (
        <Card>
          <h3 className="font-semibold text-white mb-4">Saved Palettes</h3>
          <div className="space-y-3">
            {savedPalettes.map((pal, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {pal.map((color, j) => (
                    <button
                      key={j}
                      onClick={() => copyColor(color)}
                      className="flex-1 h-10 rounded cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <button
                  onClick={() => savePalettes(savedPalettes.filter((_, idx) => idx !== i))}
                  className="p-1.5 rounded hover:bg-dark-700 text-dark-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
