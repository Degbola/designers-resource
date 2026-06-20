'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Scales a 794×1123px invoice template to fit the parent column width while
 * preserving proper A4 proportions (210×297mm).
 *
 * Uses ResizeObserver so it stays responsive when the container resizes.
 */
export function InvoiceA4Frame({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.6)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / 794)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="bg-white rounded shadow-sm relative overflow-hidden mx-auto"
      style={{ aspectRatio: '794 / 1123', maxWidth: 794 }}
    >
      <div
        style={{
          width: 794,
          height: 1123,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
