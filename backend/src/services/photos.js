import { supabase } from '../config/supabase.js'
import { isBlockedBetween } from './blocks.js'

// The photos bucket is private. Photos are only ever sent through
// GET /api/photos/<path>, which checks who is asking first, so a photo link
// on its own opens nothing.

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '')

// Profiles store each photo as its storage URL. That URL no longer opens
// anything (the bucket is private); it's only used as the photo's name.
export const PHOTO_PREFIX = `${supabaseUrl}/storage/v1/object/public/photos/`

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SEGMENT_RE = /^[A-Za-z0-9._-]{1,200}$/

export const urlForPath = (path) => `${PHOTO_PREFIX}${path}`
export const pathForUrl = (url) =>
  typeof url === 'string' && url.startsWith(PHOTO_PREFIX) ? url.slice(PHOTO_PREFIX.length) : null

// Storage path like "<userId>/<file>" (new uploads) or "profiles/<file>" (older ones)
export const isValidPhotoPath = (segments) =>
  Array.isArray(segments) &&
  segments.length >= 1 && segments.length <= 3 &&
  segments.every(s => SEGMENT_RE.test(s) && s !== '.' && s !== '..')

// New uploads go in a folder named after the uploader (storage policy enforces it)
export const folderOwner = (path) => {
  const first = path.split('/')[0]
  return UUID_RE.test(first) ? first.toLowerCase() : null
}

const profileHasPhoto = (profile, url) =>
  profile?.photo_url === url || (Array.isArray(profile?.photos) && profile.photos.some(p => p?.url === url))

// Which profile currently shows this photo
const findProfileWithPhoto = async (path) => {
  const url = urlForPath(path)
  const ownerId = folderOwner(path)
  const cols = 'user_id, photos, photo_url, onboarding_complete'

  if (ownerId) {
    const { data } = await supabase.from('profiles').select(cols).eq('user_id', ownerId).maybeSingle()
    return profileHasPhoto(data, url) ? data : null
  }

  // Older uploads (profiles/<file>) don't say who owns them, so look it up
  const { data: byPhotos } = await supabase.from('profiles').select(cols).contains('photos', [{ url }]).limit(1)
  if (byPhotos?.[0]) return byPhotos[0]
  const { data: byMain } = await supabase.from('profiles').select(cols).eq('photo_url', url).limit(1)
  return byMain?.[0] || null
}

// May this viewer see this photo?
// - your own photos, always (even ones not saved to your profile yet)
// - anyone else's only while it's on their profile, they've finished
//   onboarding (so they show up in Discover), and neither of you blocked the other
export const canViewPhoto = async (viewerId, path) => {
  if (folderOwner(path) === viewerId.toLowerCase()) return true

  const owner = await findProfileWithPhoto(path)
  if (!owner) return false
  if (owner.user_id === viewerId) return true
  if (!owner.onboarding_complete) return false
  return !(await isBlockedBetween(viewerId, owner.user_id))
}

// Photos a user may put on their profile: their own uploads, or ones that
// were already on their profile before uploads went into per-user folders
export const photoAllowedForUser = (url, userId, currentProfile) => {
  const path = pathForUrl(url)
  if (!path) return false
  if (folderOwner(path) === userId.toLowerCase()) return true
  return profileHasPhoto(currentProfile, url)
}
