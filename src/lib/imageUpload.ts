'use client'
import { createClient } from '@/lib/supabase/client'

// Resize/compress in the browser before upload -- Supabase Storage doesn't
// transform images on the Free plan (Image Transformations is a paid
// add-on), so this is the only optimization available without extra cost.
// 1600px on the longest side / ~80% JPEG quality is plenty for a page
// banner that never renders larger than the viewport width.
async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen en este navegador')
  ctx.drawImage(bitmap, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen'))),
      'image/jpeg',
      quality
    )
  })
}

const MAX_SOURCE_BYTES = 15 * 1024 * 1024 // before compression

// Uploads to the "images" bucket under the current user's own folder (RLS
// requires the first path segment to match auth.uid(), see migration 010)
// and returns the public URL to store on the block. Runs entirely with the
// browser/anon client -- never the admin client, this is a user-initiated
// write into their own space, same reasoning as every other insert
// PageView.tsx already does from the client.
export async function uploadPageImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Elegí un archivo de imagen (JPG, PNG, WebP...)')
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('La imagen pesa más de 15 MB — probá con una más liviana')
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Tu sesión expiró, volvé a iniciar sesión')

  const blob = await compressImage(file)
  const path = `${user.id}/${crypto.randomUUID()}.jpg`

  const { error } = await supabase.storage.from('images').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw new Error(error.message || 'No se pudo subir la imagen')

  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data.publicUrl
}
