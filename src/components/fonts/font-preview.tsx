'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { FontSelector } from './font-selector'
import { loadGoogleFont } from '@/lib/font-loader'

const SAMPLE_HEADING = 'The Art of Design'
const SAMPLE_SUBHEADING = 'Creating Beautiful Experiences'
const SAMPLE_BODY = 'Great design is not just about how something looks, but how it works. Every detail matters, from typography to spacing, from color to layout. The best designs feel effortless and natural.'

interface FontPreviewProps {
  headingFamily: string
  headingWeight: number
  bodyFamily: string
  bodyWeight: number
  onHeadingChange: (family: string, weight: number) => void
  onBodyChange: (family: string, weight: number) => void
}

export function FontPreview({
  headingFamily,
  headingWeight,
  bodyFamily,
  bodyWeight,
  onHeadingChange,
  onBodyChange,
}: FontPreviewProps) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadGoogleFont(headingFamily, headingWeight)
    loadGoogleFont(bodyFamily, bodyWeight)
    document.fonts.ready.then(() => setLoaded(true))
  }, [headingFamily, headingWeight, bodyFamily, bodyWeight])

  return (
    <Card className="lg:sticky lg:top-6 lg:self-start">
      <h3 className="text-sm text-dark-400 uppercase tracking-wider mb-4">Live Preview</h3>
      <div
        className="bg-dark-800 rounded-lg p-6 space-y-4"
        style={{ opacity: loaded ? 1 : 0.5, transition: 'opacity 0.3s' }}
      >
        <h1
          className="text-3xl text-white leading-tight"
          style={{ fontFamily: `'${headingFamily}', serif`, fontWeight: headingWeight }}
        >
          {SAMPLE_HEADING}
        </h1>
        <h2
          className="text-xl text-dark-200"
          style={{ fontFamily: `'${headingFamily}', serif`, fontWeight: headingWeight }}
        >
          {SAMPLE_SUBHEADING}
        </h2>
        <p
          className="text-dark-300 leading-relaxed"
          style={{ fontFamily: `'${bodyFamily}', sans-serif`, fontWeight: bodyWeight }}
        >
          {SAMPLE_BODY}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-dark-600 grid grid-cols-2 gap-4">
        <FontSelector
          label="Heading Font"
          selectedFamily={headingFamily}
          selectedWeight={headingWeight}
          onFontChange={onHeadingChange}
        />
        <FontSelector
          label="Body Font"
          selectedFamily={bodyFamily}
          selectedWeight={bodyWeight}
          onFontChange={onBodyChange}
        />
      </div>
    </Card>
  )
}
