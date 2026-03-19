'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs } from '@/components/ui/tabs'
import { FontPreview } from '@/components/fonts/font-preview'
import { FontCard } from '@/components/fonts/font-card'
import { CURATED_PAIRINGS, type FontPairing } from '@/lib/font-pairings'
import { GOOGLE_FONTS, FONT_CATEGORIES, FONT_SORTS, type FontCategory, type FontSort, type GoogleFont } from '@/lib/fonts-data'
import { loadGoogleFont } from '@/lib/font-loader'
import { ArrowLeft, Eye, Search, Flame, Sparkles, Wifi, WifiOff, Star, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function FontPairingPage() {
  // Custom pairing state
  const [headingFamily, setHeadingFamily] = useState('Playfair Display')
  const [headingWeight, setHeadingWeight] = useState(700)
  const [bodyFamily, setBodyFamily] = useState('Source Sans 3')
  const [bodyWeight, setBodyWeight] = useState(400)

  // Browse state
  const [categoryFilter, setCategoryFilter] = useState<FontCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<FontSort>('popular')
  const [searchQuery, setSearchQuery] = useState('')

  // Pairing fonts loaded state
  const [pairingFontsLoaded, setPairingFontsLoaded] = useState(false)

  // Live fonts from API
  const [livefonts, setLiveFonts] = useState<GoogleFont[]>(GOOGLE_FONTS)
  const [fontsSource, setFontsSource] = useState<'static' | 'live'>('static')
  const [fontsLoading, setFontsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/fonts')
      .then(r => r.json())
      .then(data => {
        if (data.fonts?.length) {
          setLiveFonts(data.fonts)
          setFontsSource(data.source ?? 'static')
        }
      })
      .catch(() => {/* keep static fallback */})
      .finally(() => setFontsLoading(false))
  }, [])

  // Favorites (persisted to localStorage)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('font-favorites')
      return new Set(stored ? JSON.parse(stored) : [])
    } catch { return new Set() }
  })
  const [showStarredOnly, setShowStarredOnly] = useState(false)

  const toggleFavorite = (font: GoogleFont) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(font.family)) { next.delete(font.family) } else { next.add(font.family) }
      try { localStorage.setItem('font-favorites', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  // Load curated pairing fonts
  useEffect(() => {
    CURATED_PAIRINGS.forEach(p => {
      loadGoogleFont(p.heading, p.headingWeight)
      loadGoogleFont(p.body, p.bodyWeight)
    })
    document.fonts.ready.then(() => setPairingFontsLoaded(true))
  }, [])

  // Apply a curated pairing to the preview
  const applyPairing = (p: FontPairing) => {
    setHeadingFamily(p.heading)
    setHeadingWeight(p.headingWeight)
    setBodyFamily(p.body)
    setBodyWeight(p.bodyWeight)
  }

  // Apply a font from the browser
  const selectAsHeading = (font: GoogleFont) => {
    const weight = font.variants.includes(700) ? 700 : font.variants.includes(600) ? 600 : font.variants[font.variants.length - 1]
    setHeadingFamily(font.family)
    setHeadingWeight(weight)
  }
  const selectAsBody = (font: GoogleFont) => {
    const weight = font.variants.includes(400) ? 400 : font.variants[0]
    setBodyFamily(font.family)
    setBodyWeight(weight)
  }

  // Filtered & sorted fonts
  const filteredFonts = useMemo(() => {
    let fonts = livefonts

    // Starred filter
    if (showStarredOnly) {
      fonts = fonts.filter(f => favorites.has(f.family))
    }

    // Category filter
    if (categoryFilter !== 'all') {
      fonts = fonts.filter(f => f.category === categoryFilter)
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      fonts = fonts.filter(f => f.family.toLowerCase().includes(q))
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        fonts = [...fonts].sort((a, b) => a.popularity - b.popularity)
        break
      case 'trending':
        fonts = [...fonts].sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || a.popularity - b.popularity)
        break
      case 'new':
        fonts = [...fonts].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || a.popularity - b.popularity)
        break
      case 'alpha':
        fonts = [...fonts].sort((a, b) => a.family.localeCompare(b.family))
        break
    }

    return fonts
  }, [livefonts, showStarredOnly, favorites, categoryFilter, searchQuery, sortBy])

  const trendingCount = livefonts.filter(f => f.trending).length
  const newCount = livefonts.filter(f => f.isNew).length

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-dark-100 transition-colors">
        <ArrowLeft size={16} /> Back to Tools
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
        {/* Preview Panel */}
        <FontPreview
          headingFamily={headingFamily}
          headingWeight={headingWeight}
          bodyFamily={bodyFamily}
          bodyWeight={bodyWeight}
          onHeadingChange={(f, w) => { setHeadingFamily(f); setHeadingWeight(w) }}
          onBodyChange={(f, w) => { setBodyFamily(f); setBodyWeight(w) }}
        />

        {/* Content */}
        <div>
          <Tabs
            tabs={[
              {
                id: 'pairings',
                label: 'Curated Pairings',
                content: (
                  <div className="space-y-3">
                    <p className="text-sm text-dark-400 mb-4">
                      {CURATED_PAIRINGS.length} hand-picked font pairings ready to use
                    </p>
                    {CURATED_PAIRINGS.map((pairing, i) => {
                      const isActive = headingFamily === pairing.heading && bodyFamily === pairing.body
                      return (
                        <Card
                          key={i}
                          className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-accent border-accent' : 'hover:border-black/[0.12] dark:hover:border-white/[0.15]'}`}
                          onClick={() => applyPairing(pairing)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs bg-black/[0.04] dark:bg-white/[0.04] text-dark-300 px-2 py-0.5 rounded">{pairing.category}</span>
                            {isActive && <Eye size={16} className="text-accent" />}
                          </div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4
                              className="text-xl text-dark-100 truncate"
                              style={{
                                fontFamily: `'${pairing.heading}', serif`,
                                fontWeight: pairing.headingWeight,
                                opacity: pairingFontsLoaded ? 1 : 0.5,
                                transition: 'opacity 0.3s',
                              }}
                            >
                              {pairing.heading}
                            </h4>
                            <a
                              href={`https://fonts.google.com/specimen/${encodeURIComponent(pairing.heading)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="View on Google Fonts"
                              className="shrink-0 text-dark-500 hover:text-accent transition-colors"
                            >
                              <ExternalLink size={12} />
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <p
                              className="text-sm text-dark-300"
                              style={{
                                fontFamily: `'${pairing.body}', sans-serif`,
                                fontWeight: pairing.bodyWeight,
                                opacity: pairingFontsLoaded ? 1 : 0.5,
                                transition: 'opacity 0.3s',
                              }}
                            >
                              paired with {pairing.body}
                            </p>
                            <a
                              href={`https://fonts.google.com/specimen/${encodeURIComponent(pairing.body)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="View on Google Fonts"
                              className="shrink-0 text-dark-500 hover:text-accent transition-colors"
                            >
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                ),
              },
              {
                id: 'browse',
                label: 'Browse Fonts',
                content: (
                  <div className="space-y-4">
                    {/* Source indicator */}
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {fontsLoading ? (
                        <span className="text-dark-400">Loading fonts...</span>
                      ) : fontsSource === 'live' ? (
                        <span className="flex items-center gap-1 text-emerald-500"><Wifi size={11} /> Live · {livefonts.length.toLocaleString()} fonts</span>
                      ) : (
                        <span className="flex items-center gap-1 text-dark-400"><WifiOff size={11} /> Static catalogue · {livefonts.length} fonts</span>
                      )}
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search fonts..."
                        className="w-full bg-black/[0.05] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.07] rounded-lg pl-10 pr-3 py-2 text-sm text-dark-100 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      />
                    </div>

                    {/* Category filter */}
                    <div className="flex flex-wrap gap-1.5">
                      {FONT_CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setCategoryFilter(cat.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            categoryFilter === cat.id
                              ? 'bg-accent text-white'
                              : 'bg-black/[0.05] dark:bg-white/[0.05] text-dark-300 hover:bg-white/60 dark:hover:bg-white/[0.06] hover:text-dark-100'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Sort + Starred toggle */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {FONT_SORTS.map(sort => (
                          <button
                            key={sort.id}
                            onClick={() => setSortBy(sort.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                              sortBy === sort.id
                                ? 'bg-black/[0.04] dark:bg-white/[0.04] text-dark-100'
                                : 'text-dark-400 hover:text-dark-200'
                            }`}
                          >
                            {sort.id === 'trending' && <Flame size={10} />}
                            {sort.id === 'new' && <Sparkles size={10} />}
                            {sort.label}
                            {sort.id === 'trending' && <span className="text-dark-500">({trendingCount})</span>}
                            {sort.id === 'new' && <span className="text-dark-500">({newCount})</span>}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowStarredOnly(v => !v)}
                        title={showStarredOnly ? 'Show all fonts' : 'Show starred only'}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          showStarredOnly
                            ? 'bg-amber-400/20 text-amber-500'
                            : 'text-dark-400 hover:text-amber-400'
                        }`}
                      >
                        <Star size={11} className={showStarredOnly ? 'fill-amber-400' : ''} />
                        Starred{favorites.size > 0 && <span className="text-dark-500">({favorites.size})</span>}
                      </button>
                    </div>

                    {/* Results count */}
                    <p className="text-xs text-dark-400">
                      {filteredFonts.length} font{filteredFonts.length !== 1 ? 's' : ''}
                    </p>

                    {/* Font grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {filteredFonts.map(font => (
                        <FontCard
                          key={font.family}
                          font={font}
                          onSelectAsHeading={selectAsHeading}
                          onSelectAsBody={selectAsBody}
                          isFavorite={favorites.has(font.family)}
                          onToggleFavorite={toggleFavorite}
                        />
                      ))}
                    </div>

                    {filteredFonts.length === 0 && (
                      <div className="text-center py-12 text-dark-400">
                        <p className="text-lg mb-1">{showStarredOnly ? 'No starred fonts yet' : 'No fonts found'}</p>
                        <p className="text-sm">{showStarredOnly ? 'Star fonts using the ★ icon on each card' : 'Try a different search or category'}</p>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
            defaultTab="pairings"
          />
        </div>
      </div>
    </div>
  )
}
