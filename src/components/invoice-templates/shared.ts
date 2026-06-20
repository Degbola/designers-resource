// Helpers used by all templates.

export function fmtCurrency(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function fmtDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Lighten a hex color by mixing it with white. amount: 0–1.
export function lighten(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return `#${mix(r).toString(16).padStart(2, '0')}${mix(g).toString(16).padStart(2, '0')}${mix(b).toString(16).padStart(2, '0')}`
}

// Theme palette — applied uniformly across all templates.
export interface ThemePalette {
  bg: string         // page background
  surface: string    // raised surfaces (e.g. cards, table headers)
  text: string       // primary text
  textMuted: string  // secondary text / labels
  textFaint: string  // tertiary / placeholder
  border: string     // hairline dividers
  borderStrong: string
}

export function palette(theme: 'light' | 'dark'): ThemePalette {
  if (theme === 'dark') {
    // Matte black — pure, flat, no noise or texture
    return {
      bg:           '#0a0a0a',
      surface:      '#141414',
      text:         '#ededed',
      textMuted:    '#9ca0a6',
      textFaint:    '#5e6168',
      border:       '#222222',
      borderStrong: '#333333',
    }
  }
  return {
    bg:           '#ffffff',
    surface:      '#f7f7f9',
    text:         '#1f2330',
    textMuted:    '#52525b',
    textFaint:    '#9ca3af',
    border:       '#e5e7eb',
    borderStrong: '#d1d5db',
  }
}
