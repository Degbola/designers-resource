// Client-side image resize to keep logos small while preserving quality.
// SVG passes through untouched (vectors don't need resizing).
export async function resizeImageToBase64(file: File, maxDimension = 600): Promise<string> {
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read SVG'))
      reader.readAsDataURL(file)
    })
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)

  // PNG preserves transparency for logos; JPEG for solid-background photos
  const hasTransparency = file.type === 'image/png' || file.type === 'image/webp'
  const mime = hasTransparency ? 'image/png' : 'image/jpeg'
  const quality = hasTransparency ? undefined : 0.85

  return canvas.toDataURL(mime, quality)
}
