// Tiny SVG mockups of each invoice template — used in pickers.
// Match the Monivoice-style real templates: typographic, big "Invoice" wordmark
// + thin brand-color ring as the only visual elements.

import type { TemplateId } from './types'

interface Props {
  templateId: TemplateId
  brandColor: string
  accentColor: string
  className?: string
}

const W = 120
const H = 160
const BG = '#ffffff'
const ROW = '#d4d4d8'
const TEXT_MUTED = '#9ca3af'

export function TemplateThumbnail({ templateId, brandColor, accentColor, className }: Props) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ background: BG, display: 'block' }}
    >
      {renderTemplate(templateId, brandColor, accentColor)}
    </svg>
  )
}

function renderTemplate(id: TemplateId, brand: string, accent: string) {
  switch (id) {
    case 'classic':    return <Thumb001 brand={brand} accent={accent} />
    case 'structured': return <Thumb003 brand={brand} accent={accent} />
    case 'bold':       return <Thumb006 brand={brand} accent={accent} />
    case 'banner':     return <Thumb002 brand={brand} accent={accent} />
    case 'minimal':    return <Thumb005 brand={brand} accent={accent} />
  }
}

// Ring placeholder for logo
function Ring({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  return <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={1.4} />
}

// Thin text rows representing body content
function BodyRows({ startY, count = 8, x = 10, width = W - 20 }: { startY: number; count?: number; x?: number; width?: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <rect
          key={i}
          x={x}
          y={startY + i * 5}
          width={i % 3 === 0 ? width : width * (0.7 + (i % 2) * 0.15)}
          height={1.2}
          fill={ROW}
          opacity={0.7}
        />
      ))}
    </g>
  )
}

// Template 001 — small "Invoice" top-left, ring top-right
function Thumb001({ brand }: { brand: string; accent: string }) {
  return (
    <g>
      <text x={10} y={16} fontSize={5} fill={TEXT_MUTED} fontWeight="600" letterSpacing="0.8">INVOICE</text>
      <rect x={10} y={20} width={26} height={1.2} fill={TEXT_MUTED} opacity={0.6} />
      <Ring cx={W - 16} cy={18} r={6} color={brand} />

      <BodyRows startY={50} count={10} />
    </g>
  )
}

// Template 003 — ring top-left, small "Invoice" top-right
function Thumb003({ brand }: { brand: string; accent: string }) {
  return (
    <g>
      <Ring cx={16} cy={18} r={6} color={brand} />
      <text x={W - 36} y={16} fontSize={5} fill={TEXT_MUTED} fontWeight="600" letterSpacing="0.8">INVOICE</text>
      <rect x={W - 36} y={20} width={26} height={1.2} fill={TEXT_MUTED} opacity={0.6} />

      <BodyRows startY={50} count={10} />
    </g>
  )
}

// Template 006 — BIG "Invoice" top-left, ring top-right
function Thumb006({ brand }: { brand: string; accent: string }) {
  return (
    <g>
      <text x={10} y={28} fontSize={20} fill="#3f3f46" fontWeight="300" letterSpacing="-0.5">Invoice</text>
      <Ring cx={W - 14} cy={20} r={6} color={brand} />

      <BodyRows startY={50} count={10} />
    </g>
  )
}

// Template 002 — small meta top, BIG "Invoice" + ring at BOTTOM
function Thumb002({ brand }: { brand: string; accent: string }) {
  return (
    <g>
      <text x={10} y={16} fontSize={5} fill={TEXT_MUTED} fontWeight="600" letterSpacing="0.8">INVOICE</text>
      <rect x={10} y={20} width={26} height={1.2} fill={TEXT_MUTED} opacity={0.6} />

      <BodyRows startY={32} count={12} />

      <line x1={10} y1={H - 30} x2={W - 10} y2={H - 30} stroke={ROW} strokeWidth={0.4} />
      <text x={10} y={H - 8} fontSize={20} fill="#3f3f46" fontWeight="300" letterSpacing="-0.5">Invoice</text>
      <Ring cx={W - 14} cy={H - 14} r={6} color={brand} />
    </g>
  )
}

// Template 005 — small meta + ring at top, BIG "Invoice" at BOTTOM
function Thumb005({ brand }: { brand: string; accent: string }) {
  return (
    <g>
      <text x={10} y={16} fontSize={5} fill={TEXT_MUTED} fontWeight="600" letterSpacing="0.8">INVOICE</text>
      <rect x={10} y={20} width={26} height={1.2} fill={TEXT_MUTED} opacity={0.6} />
      <Ring cx={W - 14} cy={18} r={6} color={brand} />

      <BodyRows startY={50} count={10} />

      <line x1={10} y1={H - 30} x2={W - 10} y2={H - 30} stroke={ROW} strokeWidth={0.4} />
      <text x={10} y={H - 8} fontSize={20} fill="#3f3f46" fontWeight="300" letterSpacing="-0.5">Invoice</text>
    </g>
  )
}
