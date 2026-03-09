// Rule-based design brief analysis engine

export interface BriefInput {
  brandName: string
  industry: string
  moods: string[]
  targetAudience: string
  description: string
  brandColors?: string[]
}

export interface PaletteSuggestion {
  name: string
  colors: string[]
  rationale: string
}

export interface FontSuggestion {
  heading: string
  body: string
  headingWeight: number
  bodyWeight: number
  category: string
  rationale: string
}

export interface BriefResult {
  palettes: PaletteSuggestion[]
  fonts: FontSuggestion[]
  summary: string
}

// --- Color utilities ---

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
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return '#' + toHex((r + m) * 255) + toHex((g + m) * 255) + toHex((b + m) * 255)
}

function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const rgb = [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
  const max = Math.max(...rgb), min = Math.min(...rgb)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let hue = 0
  if (max === rgb[0]) hue = ((rgb[1] - rgb[2]) / d + (rgb[1] < rgb[2] ? 6 : 0)) / 6
  else if (max === rgb[1]) hue = ((rgb[2] - rgb[0]) / d + 2) / 6
  else hue = ((rgb[0] - rgb[1]) / d + 4) / 6
  return [Math.round(hue * 360), Math.round(s * 100), Math.round(l * 100)]
}

// --- Industry mappings ---

interface IndustryProfile {
  hues: number[]         // primary hue angles
  saturation: [number, number]  // min, max
  lightness: [number, number]
  fontCategories: string[]
  label: string
}

const INDUSTRY_PROFILES: Record<string, IndustryProfile> = {
  tech:          { hues: [220, 200, 260], saturation: [60, 85], lightness: [45, 60], fontCategories: ['Tech', 'Modern', 'Clean'], label: 'Technology' },
  fashion:       { hues: [340, 0, 280], saturation: [50, 80], lightness: [40, 55], fontCategories: ['Elegant', 'Bold', 'Editorial'], label: 'Fashion' },
  food:          { hues: [30, 15, 45], saturation: [65, 90], lightness: [45, 60], fontCategories: ['Classic', 'Traditional', 'Harmonious'], label: 'Food & Beverage' },
  health:        { hues: [160, 140, 180], saturation: [40, 70], lightness: [45, 60], fontCategories: ['Clean', 'Modern', 'Professional'], label: 'Health & Wellness' },
  finance:       { hues: [220, 210, 200], saturation: [40, 65], lightness: [35, 50], fontCategories: ['Professional', 'Traditional', 'Clean'], label: 'Finance' },
  education:     { hues: [220, 40, 160], saturation: [50, 75], lightness: [45, 60], fontCategories: ['Traditional', 'Literary', 'Professional'], label: 'Education' },
  entertainment: { hues: [280, 320, 30], saturation: [70, 95], lightness: [50, 65], fontCategories: ['Bold', 'Impact', 'Modern'], label: 'Entertainment' },
  realestate:    { hues: [210, 35, 160], saturation: [35, 60], lightness: [35, 50], fontCategories: ['Elegant', 'Professional', 'Classic'], label: 'Real Estate' },
  creative:      { hues: [280, 320, 180], saturation: [65, 90], lightness: [50, 65], fontCategories: ['Bold', 'Editorial', 'Modern'], label: 'Creative Agency' },
  beauty:        { hues: [340, 310, 20], saturation: [45, 75], lightness: [50, 65], fontCategories: ['Elegant', 'Classic', 'Literary'], label: 'Beauty & Cosmetics' },
  sports:        { hues: [10, 200, 120], saturation: [75, 95], lightness: [45, 55], fontCategories: ['Impact', 'Bold', 'Modern'], label: 'Sports & Fitness' },
  nonprofit:     { hues: [160, 40, 220], saturation: [45, 70], lightness: [45, 60], fontCategories: ['Traditional', 'Clean', 'Harmonious'], label: 'Nonprofit' },
}

// --- Mood modifiers ---

interface MoodModifier {
  saturationShift: number
  lightnessShift: number
  hueShift: number
  preferDark: boolean
  fontWeightBias: 'light' | 'normal' | 'heavy'
}

const MOOD_MODIFIERS: Record<string, MoodModifier> = {
  bold:         { saturationShift: 15, lightnessShift: -5, hueShift: 0, preferDark: false, fontWeightBias: 'heavy' },
  minimal:      { saturationShift: -20, lightnessShift: 10, hueShift: 0, preferDark: false, fontWeightBias: 'light' },
  playful:      { saturationShift: 20, lightnessShift: 10, hueShift: 30, preferDark: false, fontWeightBias: 'normal' },
  elegant:      { saturationShift: -10, lightnessShift: -5, hueShift: 0, preferDark: true, fontWeightBias: 'light' },
  professional: { saturationShift: -15, lightnessShift: -5, hueShift: 0, preferDark: false, fontWeightBias: 'normal' },
  energetic:    { saturationShift: 20, lightnessShift: 5, hueShift: 15, preferDark: false, fontWeightBias: 'heavy' },
  calm:         { saturationShift: -15, lightnessShift: 10, hueShift: -10, preferDark: false, fontWeightBias: 'light' },
  luxury:       { saturationShift: -5, lightnessShift: -10, hueShift: 0, preferDark: true, fontWeightBias: 'normal' },
  warm:         { saturationShift: 10, lightnessShift: 5, hueShift: 20, preferDark: false, fontWeightBias: 'normal' },
  cool:         { saturationShift: 5, lightnessShift: 5, hueShift: -20, preferDark: false, fontWeightBias: 'light' },
  retro:        { saturationShift: -10, lightnessShift: -5, hueShift: 10, preferDark: false, fontWeightBias: 'normal' },
  futuristic:   { saturationShift: 15, lightnessShift: 0, hueShift: -15, preferDark: true, fontWeightBias: 'heavy' },
}

// --- Font pairings database ---

const FONT_PAIRINGS: FontSuggestion[] = [
  { heading: 'Playfair Display', body: 'Source Sans 3', headingWeight: 700, bodyWeight: 400, category: 'Classic', rationale: '' },
  { heading: 'Montserrat', body: 'Merriweather', headingWeight: 700, bodyWeight: 400, category: 'Modern', rationale: '' },
  { heading: 'Oswald', body: 'Quattrocento', headingWeight: 600, bodyWeight: 400, category: 'Editorial', rationale: '' },
  { heading: 'Raleway', body: 'Lato', headingWeight: 700, bodyWeight: 400, category: 'Clean', rationale: '' },
  { heading: 'Abril Fatface', body: 'Poppins', headingWeight: 400, bodyWeight: 300, category: 'Bold', rationale: '' },
  { heading: 'Cormorant Garamond', body: 'Fira Sans', headingWeight: 600, bodyWeight: 400, category: 'Elegant', rationale: '' },
  { heading: 'Work Sans', body: 'Bitter', headingWeight: 700, bodyWeight: 400, category: 'Professional', rationale: '' },
  { heading: 'DM Serif Display', body: 'DM Sans', headingWeight: 400, bodyWeight: 400, category: 'Harmonious', rationale: '' },
  { heading: 'Space Grotesk', body: 'Space Mono', headingWeight: 700, bodyWeight: 400, category: 'Tech', rationale: '' },
  { heading: 'Libre Baskerville', body: 'Open Sans', headingWeight: 700, bodyWeight: 400, category: 'Traditional', rationale: '' },
  { heading: 'Bebas Neue', body: 'Roboto', headingWeight: 400, bodyWeight: 300, category: 'Impact', rationale: '' },
  { heading: 'Crimson Pro', body: 'Work Sans', headingWeight: 600, bodyWeight: 400, category: 'Literary', rationale: '' },
]

// --- Core analysis ---

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function generatePaletteFromHue(baseHue: number, sat: number, lit: number, name: string, rationale: string): PaletteSuggestion {
  return {
    name,
    colors: [
      hslToHex(baseHue, sat, lit),
      hslToHex((baseHue + 30) % 360, clamp(sat - 10, 20, 95), clamp(lit + 10, 20, 85)),
      hslToHex((baseHue + 180) % 360, clamp(sat - 15, 20, 95), clamp(lit + 5, 20, 85)),
      hslToHex(baseHue, clamp(sat - 25, 10, 80), clamp(lit + 25, 30, 90)),
      hslToHex(baseHue, clamp(sat - 30, 5, 60), 15),
    ],
    rationale,
  }
}

export function analyzeBrief(input: BriefInput): BriefResult {
  const profile = INDUSTRY_PROFILES[input.industry] || INDUSTRY_PROFILES.creative

  // Aggregate mood modifiers
  let satShift = 0, litShift = 0, hueShift = 0
  const preferDark = input.moods.some(m => MOOD_MODIFIERS[m]?.preferDark)
  const fontBiases: string[] = []

  for (const mood of input.moods) {
    const mod = MOOD_MODIFIERS[mood]
    if (mod) {
      satShift += mod.saturationShift
      litShift += mod.lightnessShift
      hueShift += mod.hueShift
      fontBiases.push(mod.fontWeightBias)
    }
  }

  // Normalize shifts
  const moodCount = Math.max(input.moods.length, 1)
  satShift = Math.round(satShift / moodCount)
  litShift = Math.round(litShift / moodCount)
  hueShift = Math.round(hueShift / moodCount)

  const baseSat = clamp(((profile.saturation[0] + profile.saturation[1]) / 2) + satShift, 15, 95)
  const baseLit = clamp(((profile.lightness[0] + profile.lightness[1]) / 2) + litShift, 20, 75)

  // Generate 3 palettes using different base hues from the industry profile
  const moodLabel = input.moods.length > 0 ? input.moods.join(' & ') : 'versatile'
  const palettes: PaletteSuggestion[] = [
    generatePaletteFromHue(
      (profile.hues[0] + hueShift + 360) % 360, baseSat, baseLit,
      'Primary Palette',
      `Built around the primary ${profile.label.toLowerCase()} hue with ${moodLabel} mood adjustments. The accent and neutral tones provide balance.`
    ),
    generatePaletteFromHue(
      (profile.hues[1] + hueShift + 360) % 360, clamp(baseSat - 10, 15, 90), clamp(baseLit + 5, 25, 75),
      'Alternate Palette',
      `An alternative direction using a secondary hue. Slightly softer saturation creates a more subdued feel while maintaining the ${moodLabel} character.`
    ),
    generatePaletteFromHue(
      ((profile.hues[0] + profile.hues[2]) / 2 + hueShift + 360) % 360, clamp(baseSat + 5, 20, 95), clamp(baseLit - 5, 20, 70),
      'Bold Variation',
      `A bolder take blending industry hues for stronger visual impact. Works well for key CTAs and feature highlights.`
    ),
  ]

  // If user provided brand colors, create a palette based on those
  if (input.brandColors && input.brandColors.length > 0) {
    const brandHsl = input.brandColors.map(c => hexToHsl(c))
    const avgHue = Math.round(brandHsl.reduce((s, h) => s + h[0], 0) / brandHsl.length)
    const avgSat = Math.round(brandHsl.reduce((s, h) => s + h[1], 0) / brandHsl.length)
    const avgLit = Math.round(brandHsl.reduce((s, h) => s + h[2], 0) / brandHsl.length)
    palettes[0] = generatePaletteFromHue(
      avgHue, clamp(avgSat + satShift, 15, 95), clamp(avgLit + litShift, 20, 75),
      'Brand-Aligned Palette',
      `Derived from your brand colors with ${moodLabel} mood adjustments. Maintains brand consistency while expanding the palette.`
    )
    // Include the original brand colors in the first palette
    input.brandColors.slice(0, 3).forEach((c, i) => {
      palettes[0].colors[i] = c
    })
  }

  // Select font pairings based on industry categories and mood
  const targetCategories = profile.fontCategories
  const scoredFonts = FONT_PAIRINGS.map(f => {
    let score = 0
    if (targetCategories.includes(f.category)) score += 3
    // Mood-based weight scoring
    const heavyBias = fontBiases.filter(b => b === 'heavy').length
    const lightBias = fontBiases.filter(b => b === 'light').length
    if (heavyBias > lightBias && f.headingWeight >= 600) score += 1
    if (lightBias > heavyBias && f.headingWeight <= 500) score += 1
    return { font: f, score }
  }).sort((a, b) => b.score - a.score)

  const fonts: FontSuggestion[] = scoredFonts.slice(0, 3).map((sf, i) => ({
    ...sf.font,
    rationale: i === 0
      ? `Best match for ${profile.label.toLowerCase()} with a ${moodLabel} feel. The ${sf.font.heading} heading paired with ${sf.font.body} body creates a ${sf.font.category.toLowerCase()} aesthetic.`
      : `Alternative ${sf.font.category.toLowerCase()} pairing that complements ${profile.label.toLowerCase()} brands. ${sf.font.heading} brings character while ${sf.font.body} ensures readability.`,
  }))

  const summary = `Based on the ${profile.label} industry and ${moodLabel} mood, we recommend ${preferDark ? 'deeper, richer' : 'balanced'} color palettes with ${fontBiases.includes('heavy') ? 'strong, bold' : fontBiases.includes('light') ? 'refined, lightweight' : 'versatile'} typography. ${input.brandName ? `For ${input.brandName}, these` : 'These'} combinations create a cohesive visual identity that resonates with ${input.targetAudience || 'your target audience'}.`

  return { palettes, fonts, summary }
}
