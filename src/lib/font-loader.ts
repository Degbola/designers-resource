export function loadGoogleFont(family: string, weight: number) {
  if (typeof document === 'undefined') return
  const id = `font-${family.replace(/\s+/g, '-')}-${weight}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`
  document.head.appendChild(link)
}

export function isFontLoaded(family: string): boolean {
  if (typeof document === 'undefined') return false
  return document.fonts.check(`16px "${family}"`)
}

export function preloadFonts(fonts: { family: string; weight: number }[]): Promise<void> {
  fonts.forEach(f => loadGoogleFont(f.family, f.weight))
  if (typeof document === 'undefined') return Promise.resolve()
  return document.fonts.ready.then(() => {})
}
