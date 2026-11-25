import { useEffect, useState } from 'react'
import apiClient from '@/api/client'
import { supabase } from '@/lib/supabase'

// Photos live in a private bucket. Profiles still name each photo by its
// storage URL, but that URL opens nothing: the app loads the image through
// GET /api/photos/<path> with the viewer's login, and the backend decides
// whether they may see it. The image only exists inside the app as a
// temporary blob: URL, so there's no link to share.

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const PHOTO_PREFIX = `${supabaseUrl}/storage/v1/object/public/photos/`

export const isStoragePhoto = (url) => typeof url === 'string' && url.startsWith(PHOTO_PREFIX)

const apiPath = (url) =>
  '/api/photos/' + url.slice(PHOTO_PREFIX.length).split('/').map(encodeURIComponent).join('/')

// url -> Promise<blob: URL | null>, so each photo is downloaded once per session
const cache = new Map()

export const loadSecurePhoto = (url) => {
  if (!isStoragePhoto(url)) return Promise.resolve(url || null)
  if (!cache.has(url)) {
    const p = apiClient.get(apiPath(url), { responseType: 'blob' })
      .then(blob => URL.createObjectURL(blob))
      .catch(() => {
        // Don't remember failures, so it can be retried later
        cache.delete(url)
        return null
      })
    cache.set(url, p)
  }
  return cache.get(url)
}

// Signing out drops every loaded photo from memory
const clearCache = () => {
  for (const p of cache.values()) p.then(u => u && URL.revokeObjectURL(u))
  cache.clear()
}
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') clearCache()
})

// Returns something an <img> can show, or null while loading / not allowed
export const useSecurePhoto = (url) => {
  const [state, setState] = useState({ url: null, src: isStoragePhoto(url) ? null : (url || null) })

  useEffect(() => {
    let cancelled = false
    if (!isStoragePhoto(url)) {
      setState({ url, src: url || null })
      return
    }
    loadSecurePhoto(url).then(src => { if (!cancelled) setState({ url, src }) })
    return () => { cancelled = true }
  }, [url])

  // Never show the previous photo while the next one loads
  return state.url === url ? state.src : (isStoragePhoto(url) ? null : url || null)
}
