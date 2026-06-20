'use client'

import { useEffect } from 'react'
import { ClassicTemplate } from './ClassicTemplate'
import { StructuredTemplate } from './StructuredTemplate'
import { BoldTemplate } from './BoldTemplate'
import { BannerTemplate } from './BannerTemplate'
import { MinimalTemplate } from './MinimalTemplate'
import { loadGoogleFont } from '@/lib/font-loader'
import type { InvoiceData, TemplateId } from './types'

export { TEMPLATE_LIST } from './types'
export type { InvoiceData, TemplateId, InvoiceLineItem, InvoiceParty } from './types'

const TEMPLATES: Record<TemplateId, (props: { data: InvoiceData }) => React.JSX.Element> = {
  classic: ClassicTemplate,
  structured: StructuredTemplate,
  bold: BoldTemplate,
  banner: BannerTemplate,
  minimal: MinimalTemplate,
}

export function InvoiceTemplate({ templateId, data }: { templateId: TemplateId; data: InvoiceData }) {
  // Lazy-load the chosen Google Font (no-op if already loaded)
  useEffect(() => {
    if (data.font_family) {
      loadGoogleFont(data.font_family, data.font_weight || 400)
      // Also preload the heavier weight used for headers
      loadGoogleFont(data.font_family, 600)
    }
  }, [data.font_family, data.font_weight])

  const Component = TEMPLATES[templateId] ?? TEMPLATES.classic
  return <Component data={data} />
}
