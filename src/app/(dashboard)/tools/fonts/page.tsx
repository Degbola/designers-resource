'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'

interface FontPairing {
  heading: string
  body: string
  headingWeight: number
  bodyWeight: number
  category: string
}

const PAIRINGS: FontPairing[] = [
  { heading: 'Playfair Display', body: 'Source Sans 3', headingWeight: 700, bodyWeight: 400, category: 'Classic' },
  { heading: 'Montserrat', body: 'Merriweather', headingWeight: 700, bodyWeight: 400, category: 'Modern' },
  { heading: 'Oswald', body: 'Quattrocento', headingWeight: 600, bodyWeight: 400, category: 'Editorial' },
  { heading: 'Raleway', body: 'Lato', headingWeight: 700, bodyWeight: 400, category: 'Clean' },
  { heading: 'Abril Fatface', body: 'Poppins', headingWeight: 400, bodyWeight: 300, category: 'Bold' },
  { heading: 'Cormorant Garamond', body: 'Fira Sans', headingWeight: 600, bodyWeight: 400, category: 'Elegant' },
  { heading: 'Work Sans', body: 'Bitter', headingWeight: 700, bodyWeight: 400, category: 'Professional' },
  { heading: 'DM Serif Display', body: 'DM Sans', headingWeight: 400, bodyWeight: 400, category: 'Harmonious' },
  { heading: 'Space Grotesk', body: 'Space Mono', headingWeight: 700, bodyWeight: 400, category: 'Tech' },
  { heading: 'Libre Baskerville', body: 'Open Sans', headingWeight: 700, bodyWeight: 400, category: 'Traditional' },
  { heading: 'Bebas Neue', body: 'Roboto', headingWeight: 400, bodyWeight: 300, category: 'Impact' },
  { heading: 'Crimson Pro', body: 'Work Sans', headingWeight: 600, bodyWeight: 400, category: 'Literary' },
]

const SAMPLE_HEADING = 'The Art of Design'
const SAMPLE_SUBHEADING = 'Creating Beautiful Experiences'
const SAMPLE_BODY = 'Great design is not just about how something looks, but how it works. Every detail matters, from typography to spacing, from color to layout. The best designs feel effortless and natural.'

function loadGoogleFont(fontName: string, weight: number) {
  const id = `font-${fontName.replace(/\s+/g, '-')}-${weight}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@${weight}&display=swap`
  document.head.appendChild(link)
}

export default function FontPairingPage() {
  const [selectedPairing, setSelectedPairing] = useState<FontPairing | null>(null)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  useEffect(() => {
    PAIRINGS.forEach((p) => {
      loadGoogleFont(p.heading, p.headingWeight)
      loadGoogleFont(p.body, p.bodyWeight)
    })
    document.fonts.ready.then(() => setFontsLoaded(true))
  }, [])

  const activePairing = selectedPairing || PAIRINGS[0]

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-dark-300 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Tools
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <Card className="lg:sticky lg:top-6 lg:self-start">
          <h3 className="text-sm text-dark-400 uppercase tracking-wider mb-4">Live Preview</h3>
          <div className="bg-dark-800 rounded-lg p-6 space-y-4" style={{ opacity: fontsLoaded ? 1 : 0.5, transition: 'opacity 0.3s' }}>
            <h1
              className="text-3xl text-white leading-tight"
              style={{ fontFamily: `'${activePairing.heading}', serif`, fontWeight: activePairing.headingWeight }}
            >
              {SAMPLE_HEADING}
            </h1>
            <h2
              className="text-xl text-dark-200"
              style={{ fontFamily: `'${activePairing.heading}', serif`, fontWeight: activePairing.headingWeight }}
            >
              {SAMPLE_SUBHEADING}
            </h2>
            <p
              className="text-dark-300 leading-relaxed"
              style={{ fontFamily: `'${activePairing.body}', sans-serif`, fontWeight: activePairing.bodyWeight }}
            >
              {SAMPLE_BODY}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-dark-600 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-dark-400 text-xs mb-1">Heading Font</p>
              <p className="text-white font-medium">{activePairing.heading}</p>
              <p className="text-dark-400 text-xs">Weight: {activePairing.headingWeight}</p>
            </div>
            <div>
              <p className="text-dark-400 text-xs mb-1">Body Font</p>
              <p className="text-white font-medium">{activePairing.body}</p>
              <p className="text-dark-400 text-xs">Weight: {activePairing.bodyWeight}</p>
            </div>
          </div>
        </Card>

        {/* Pairings List */}
        <div className="space-y-3">
          <h3 className="text-sm text-dark-400 uppercase tracking-wider">Font Pairings</h3>
          {PAIRINGS.map((pairing, i) => {
            const isActive = activePairing.heading === pairing.heading && activePairing.body === pairing.body
            return (
              <Card
                key={i}
                className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-accent border-accent' : 'hover:border-dark-500'}`}
                onClick={() => setSelectedPairing(pairing)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs bg-dark-600 text-dark-300 px-2 py-0.5 rounded">{pairing.category}</span>
                  {isActive && <Eye size={16} className="text-accent" />}
                </div>
                <h4
                  className="text-xl text-white mb-1"
                  style={{ fontFamily: `'${pairing.heading}', serif`, fontWeight: pairing.headingWeight, opacity: fontsLoaded ? 1 : 0.5 }}
                >
                  {pairing.heading}
                </h4>
                <p
                  className="text-sm text-dark-300"
                  style={{ fontFamily: `'${pairing.body}', sans-serif`, fontWeight: pairing.bodyWeight, opacity: fontsLoaded ? 1 : 0.5 }}
                >
                  paired with {pairing.body}
                </p>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
