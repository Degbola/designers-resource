// Shared decorative SVG elements used across invoice templates.
// Inline SVG so they survive html2canvas → PDF capture cleanly.

import { lighten } from './shared'

/** Cluster of dots — BRIX-style decorative element (top-right header). */
export function DotCluster({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} xmlns="http://www.w3.org/2000/svg">
      {[
        [10, 6], [22, 6], [34, 6], [46, 6],
        [10, 18], [22, 18], [34, 18], [46, 18],
        [10, 30], [22, 30], [34, 30], [46, 30],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={2} fill={color} opacity={0.35 + (i % 3) * 0.15} />
      ))}
    </svg>
  )
}

/** Soft gradient blob — used in corners of Minimal template. */
export function GradientBlob({ color, className, style }: { color: string; className?: string; style?: React.CSSProperties }) {
  const id = `g-${color.replace('#', '')}`
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="60%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill={`url(#${id})`} />
    </svg>
  )
}

/** Wavy abstract shape inside a header card — Invoice 1/3 style. */
export function HeaderWave({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 220 120" className={className} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M0,80 Q60,40 110,70 T220,50 L220,120 L0,120 Z" fill={color} opacity="0.18" />
      <path d="M0,95 Q70,60 140,85 T220,75 L220,120 L0,120 Z" fill={color} opacity="0.12" />
    </svg>
  )
}

/** Linear gradient header background — used by banner/header cards. */
export function gradientBg(color: string): string {
  return `linear-gradient(135deg, ${color} 0%, ${lighten(color, 0.25)} 100%)`
}

/** Subtle dotted background pattern, very low opacity. */
export function DottedPattern({ color, className }: { color: string; className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill={color} opacity="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  )
}
