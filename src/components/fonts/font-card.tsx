'use client'

import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { loadGoogleFont } from '@/lib/font-loader'
import type { GoogleFont } from '@/lib/fonts-data'
import { Flame, Sparkles, Type, Download, Star, ExternalLink } from 'lucide-react'

interface FontCardProps {
  font: GoogleFont
  onSelectAsHeading: (font: GoogleFont) => void
  onSelectAsBody: (font: GoogleFont) => void
  isFavorite?: boolean
  onToggleFavorite?: (font: GoogleFont) => void
}

export function FontCard({ font, onSelectAsHeading, onSelectAsBody, isFavorite = false, onToggleFavorite }: FontCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const weight = font.variants.includes(400) ? 400 : font.variants[0]
    loadGoogleFont(font.family, weight)
    document.fonts.ready.then(() => setLoaded(true))
  }, [visible, font.family, font.variants])

  const previewWeight = font.variants.includes(400) ? 400 : font.variants[0]

  return (
    <div ref={ref}>
    <Card className="group relative hover:border-white/60 transition-all">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[10px] uppercase tracking-wider text-dark-400 bg-white/30 px-1.5 py-0.5 rounded">
          {font.category}
        </span>
        {font.trending && (
          <span className="text-[10px] text-orange-400 flex items-center gap-0.5">
            <Flame size={10} />
          </span>
        )}
        {font.isNew && (
          <span className="text-[10px] text-green-400 flex items-center gap-0.5">
            <Sparkles size={10} />
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <a
            href={`https://fonts.google.com/specimen/${encodeURIComponent(font.family)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="View on Google Fonts"
            className="text-dark-500 hover:text-accent transition-colors"
          >
            <ExternalLink size={11} />
          </a>
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(font) }}
              title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
              className="transition-colors cursor-pointer"
            >
              <Star
                size={12}
                className={isFavorite ? 'fill-amber-400 text-amber-400' : 'text-dark-500 hover:text-amber-400'}
              />
            </button>
          )}
        </div>
      </div>

      <p
        className="text-xl text-dark-100 mb-1 truncate"
        style={{
          fontFamily: visible ? `'${font.family}', ${font.category === 'serif' ? 'serif' : 'sans-serif'}` : 'inherit',
          fontWeight: previewWeight,
          opacity: visible && loaded ? 1 : 0.4,
          transition: 'opacity 0.3s',
        }}
      >
        {font.family}
      </p>
      <p className="text-xs text-dark-400 mb-3">
        {font.variants.length} weight{font.variants.length !== 1 ? 's' : ''}
      </p>

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onSelectAsHeading(font) }}
          className="flex-1 text-[11px] px-2 py-1.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <Type size={11} /> Heading
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSelectAsBody(font) }}
          className="flex-1 text-[11px] px-2 py-1.5 rounded bg-white/40 text-dark-300 hover:bg-white/60 transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <Type size={11} /> Body
        </button>
        <a
          href={`https://fonts.google.com/download?family=${encodeURIComponent(font.family)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Download from Google Fonts"
          className="text-[11px] px-2 py-1.5 rounded bg-white/40 text-dark-300 hover:bg-white/60 transition-colors flex items-center justify-center"
        >
          <Download size={11} />
        </a>
      </div>
    </Card>
    </div>
  )
}
