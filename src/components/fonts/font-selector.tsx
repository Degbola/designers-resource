'use client'

import { useState, useRef, useEffect } from 'react'
import { GOOGLE_FONTS, type GoogleFont } from '@/lib/fonts-data'
import { loadGoogleFont } from '@/lib/font-loader'
import { ChevronDown, Search } from 'lucide-react'

interface FontSelectorProps {
  label: string
  selectedFamily: string
  selectedWeight: number
  onFontChange: (family: string, weight: number) => void
}

export function FontSelector({ label, selectedFamily, selectedWeight, onFontChange }: FontSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = GOOGLE_FONTS.filter(f =>
    f.family.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50)

  // Load fonts for visible dropdown items
  useEffect(() => {
    if (!open) return
    filtered.slice(0, 10).forEach(f => {
      const w = f.variants.includes(400) ? 400 : f.variants[0]
      loadGoogleFont(f.family, w)
    })
  }, [open, filtered])

  const selectedFont = GOOGLE_FONTS.find(f => f.family === selectedFamily)
  const availableWeights = selectedFont?.variants || [400]

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-dark-400">{label}</p>
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white hover:border-dark-400 transition-colors cursor-pointer"
          style={{ fontFamily: `'${selectedFamily}', sans-serif` }}
        >
          <span className="truncate">{selectedFamily}</span>
          <ChevronDown size={14} className={`text-dark-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-dark-800 border border-dark-600 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-dark-600">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search fonts..."
                  className="w-full bg-dark-700 border border-dark-500 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-dark-400 focus:outline-none focus:border-accent"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.map(f => {
                const w = f.variants.includes(400) ? 400 : f.variants[0]
                return (
                  <button
                    key={f.family}
                    onClick={() => {
                      const weight = f.variants.includes(selectedWeight) ? selectedWeight : (f.variants.includes(400) ? 400 : f.variants[0])
                      onFontChange(f.family, weight)
                      setOpen(false)
                      setSearch('')
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-dark-700 transition-colors cursor-pointer flex items-center justify-between ${
                      f.family === selectedFamily ? 'text-accent bg-accent/5' : 'text-white'
                    }`}
                  >
                    <span style={{ fontFamily: `'${f.family}', sans-serif`, fontWeight: w }} className="truncate">
                      {f.family}
                    </span>
                    <span className="text-[10px] text-dark-400 ml-2 shrink-0">{f.category}</span>
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-sm text-dark-400 text-center">No fonts found</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Weight selector */}
      <select
        value={selectedWeight}
        onChange={e => onFontChange(selectedFamily, Number(e.target.value))}
        className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-1.5 text-xs text-dark-200 focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer"
      >
        {availableWeights.map(w => (
          <option key={w} value={w}>
            {w} {w <= 300 ? '- Light' : w <= 400 ? '- Regular' : w <= 500 ? '- Medium' : w <= 600 ? '- Semi Bold' : w <= 700 ? '- Bold' : w <= 800 ? '- Extra Bold' : '- Black'}
          </option>
        ))}
      </select>
    </div>
  )
}
