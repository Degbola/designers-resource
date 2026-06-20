'use client'

import { useState, useRef } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Upload, Check, X, Loader2 } from 'lucide-react'
import { resizeImageToBase64 } from '@/lib/image-resize'
import { TemplateThumbnail } from '@/components/invoice-templates/Thumbnail'
import { TEMPLATE_LIST, type TemplateId } from '@/components/invoice-templates'
import { FontSelector } from '@/components/fonts/font-selector'
import { loadGoogleFont } from '@/lib/font-loader'
import type { BrandSettings } from '@/app/api/brand-settings/route'

export function BrandSettingsClient({ initial }: { initial: BrandSettings }) {
  const [settings, setSettings] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (file: File) => {
    setError('')
    setUploading(true)
    try {
      if (file.size > 8 * 1024 * 1024) {
        setError('File too large — please pick something under 8MB')
        return
      }
      const dataUrl = await resizeImageToBase64(file, 600)
      setSettings({ ...settings, logo_url: dataUrl })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process image')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/brand-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="font-serif text-3xl text-dark-100 mb-1">Brand Settings</h1>
        <p className="text-sm text-dark-400">Your logo and colors are applied to every invoice you generate.</p>
      </div>

      {/* Logo */}
      <Card>
        <CardTitle>Logo</CardTitle>
        <CardDescription>PNG, SVG, or JPG. Auto-resized to 600px max — kept small for emailable PDFs.</CardDescription>
        <div className="mt-4 flex items-center gap-5">
          <div className="w-32 h-32 rounded border border-dashed border-dark-600 dark:border-[rgba(255,255,255,0.10)] flex items-center justify-center bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.02)] overflow-hidden">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-[10px] uppercase tracking-[0.1em] text-dark-400">No logo</span>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }}
            />
            <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {settings.logo_url ? 'Replace' : 'Upload Logo'}
            </Button>
            {settings.logo_url && (
              <Button variant="ghost" size="sm" onClick={() => setSettings({ ...settings, logo_url: '' })}>
                <X size={12} /> Remove
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Colors */}
      <Card>
        <CardTitle>Brand Colors</CardTitle>
        <CardDescription>Used for headers, accents, and totals across all invoice templates.</CardDescription>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ColorPicker
            label="Primary"
            value={settings.brand_color}
            onChange={(v) => setSettings({ ...settings, brand_color: v })}
          />
          <ColorPicker
            label="Accent"
            value={settings.accent_color}
            onChange={(v) => setSettings({ ...settings, accent_color: v })}
          />
        </div>
      </Card>

      {/* Default template */}
      <Card>
        <CardTitle>Default Template</CardTitle>
        <CardDescription>Used when you create a new invoice. You can override per-invoice. Thumbnails preview your brand colors.</CardDescription>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {TEMPLATE_LIST.map(t => {
            const selected = settings.default_template === t.id
            return (
              <button
                key={t.id}
                onClick={() => setSettings({ ...settings, default_template: t.id as TemplateId })}
                className={`text-left rounded-md border transition-all overflow-hidden group ${
                  selected
                    ? 'border-accent ring-2 ring-accent/30'
                    : 'border-dark-600 dark:border-[rgba(255,255,255,0.08)] hover:border-accent/40'
                }`}
              >
                <div className="bg-white border-b border-dark-600 dark:border-[rgba(255,255,255,0.05)]">
                  <TemplateThumbnail
                    templateId={t.id}
                    brandColor={settings.brand_color}
                    accentColor={settings.accent_color}
                    className="w-full h-auto"
                  />
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] font-display font-semibold uppercase tracking-[0.06em] text-dark-100 flex items-center gap-1">
                    {t.label}
                    {selected && <Check size={11} className="text-accent" />}
                  </p>
                  <p className="text-[10px] text-dark-400 mt-0.5 leading-tight">{t.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Theme */}
      <Card>
        <CardTitle>Background</CardTitle>
        <CardDescription>Default background for new invoices. You can override per-invoice.</CardDescription>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(['light', 'dark'] as const).map(t => {
            const selected = settings.default_theme === t
            return (
              <button
                key={t}
                onClick={() => setSettings({ ...settings, default_theme: t })}
                className={`rounded-md border transition-all overflow-hidden text-left ${
                  selected ? 'border-accent ring-2 ring-accent/30' : 'border-dark-600 dark:border-[rgba(255,255,255,0.08)] hover:border-accent/40'
                }`}
              >
                <div className="p-4" style={{ background: t === 'light' ? '#ffffff' : '#0f1115', color: t === 'light' ? '#1f2330' : '#e7e9ee' }}>
                  <p className="text-xs font-semibold mb-1">Invoice</p>
                  <p className="text-[10px] opacity-70">Preview · {t === 'light' ? 'Bright background' : 'Dark background'}</p>
                </div>
                <div className="px-3 py-2 bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.02)]">
                  <p className="text-[11px] font-display font-semibold uppercase tracking-[0.06em] text-dark-100 flex items-center gap-1">
                    {t === 'light' ? 'Light' : 'Dark'}
                    {selected && <Check size={11} className="text-accent" />}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Typography */}
      <Card>
        <CardTitle>Typography</CardTitle>
        <CardDescription>Font applied across all invoice templates. Pulled from Google Fonts.</CardDescription>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
          <FontSelector
            label="Font Family"
            selectedFamily={settings.font_family}
            selectedWeight={settings.font_weight}
            onFontChange={(family, weight) => {
              loadGoogleFont(family, weight)
              setSettings({ ...settings, font_family: family, font_weight: weight })
            }}
          />
          <div className="rounded border border-dark-600 dark:border-[rgba(255,255,255,0.08)] p-4 bg-white">
            <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 mb-2">Preview</p>
            <p className="text-2xl text-zinc-900" style={{ fontFamily: `'${settings.font_family}', sans-serif`, fontWeight: settings.font_weight }}>Invoice</p>
            <p className="text-sm text-zinc-700 mt-1" style={{ fontFamily: `'${settings.font_family}', sans-serif`, fontWeight: settings.font_weight }}>From your business · $1,234.00</p>
          </div>
        </div>
      </Card>

      {/* Business details */}
      <Card>
        <CardTitle>Business Details</CardTitle>
        <CardDescription>Shown on the &ldquo;From&rdquo; section of every invoice.</CardDescription>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Business Name" value={settings.business_name} onChange={(e) => setSettings({ ...settings, business_name: e.target.value })} />
          <Input label="Business Email" type="email" value={settings.business_email} onChange={(e) => setSettings({ ...settings, business_email: e.target.value })} />
          <Input label="Phone" value={settings.business_phone} onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })} />
          <div className="sm:row-span-2">
            <Textarea label="Address" value={settings.business_address} onChange={(e) => setSettings({ ...settings, business_address: e.target.value })} />
          </div>
        </div>
        <div className="mt-4">
          <Textarea
            label="Default Terms / Footer"
            value={settings.default_terms}
            onChange={(e) => setSettings({ ...settings, default_terms: e.target.value })}
            placeholder="Payment terms, bank details, thank-you message…"
          />
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {error && <span className="text-[11px] text-red-500">{error}</span>}
        {saved && (
          <span className="inline-flex items-center gap-1 text-[11px] text-accent">
            <Check size={12} /> Saved
          </span>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          Save Changes
        </Button>
      </div>
    </div>
  )
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-300">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-10 rounded border border-dark-600 dark:border-[rgba(255,255,255,0.08)] cursor-pointer bg-transparent"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-[7px] text-[13px] font-display rounded text-dark-100 bg-[#FDFCFA] dark:bg-[rgba(255,255,255,0.04)] border border-dark-600 dark:border-[rgba(255,255,255,0.08)] focus:outline-none focus:border-accent/50 transition-colors tabular-nums"
        />
      </div>
    </div>
  )
}
