import { supabase } from '../config/supabase.js'
import { canViewPhoto, isValidPhotoPath } from '../services/photos.js'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif'])

export const getPhoto = async (req, res) => {
  try {
    const segments = req.params.path
    // Same answer for "doesn't exist" and "not allowed", so nobody can probe
    const notFound = () => res.status(404).json({ error: 'Photo not found' })

    if (!isValidPhotoPath(segments)) return notFound()
    const path = segments.join('/')

    if (!(await canViewPhoto(req.user.id, path))) return notFound()

    const { data: blob, error } = await supabase.storage.from('photos').download(path)
    if (error || !blob) return notFound()

    const type = IMAGE_TYPES.has(blob.type) ? blob.type : 'application/octet-stream'
    res.set({
      'Content-Type': type,
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      // Only this browser may keep it, and only briefly
      'Cache-Control': 'private, max-age=300',
    })
    res.send(Buffer.from(await blob.arrayBuffer()))
  } catch (error) {
    console.error('Get photo error:', error)
    res.status(500).json({ error: 'Failed to load photo' })
  }
}
