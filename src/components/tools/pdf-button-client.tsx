'use client'

import dynamic from 'next/dynamic'

export const PdfDownloadButton = dynamic(
  () => import('@/components/tools/pdf-download-button').then(m => m.PdfDownloadButton),
  { ssr: false, loading: () => null }
)
