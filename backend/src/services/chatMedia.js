import crypto from 'node:crypto'
import { supabase } from '../config/supabase.js'

// Photos, videos and voice messages sent in chats. Files go in the private
// "chat-media" bucket under <matchId>/, and are only ever sent back through
// the API after checking the person asking is in that chat.

export const BUCKET = 'chat-media'

// What each kind accepts, and how big it may be
export const MEDIA = {
  image: { max: 10 * 1024 * 1024, label: 'Photo', types: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } },
  video: { max: 25 * 1024 * 1024, label: 'Video', types: { 'video/mp4': 'mp4', 'video/quicktime': 'mov' } },
  audio: { max: 5 * 1024 * 1024, label: 'Voice message', types: { 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/mpeg': 'mp3', 'audio/webm': 'webm', 'audio/ogg': 'ogg' } },
}

export const ALL_TYPES = Object.values(MEDIA).flatMap(m => Object.keys(m.types))

// "audio/mp4;codecs=mp4a.40.2" -> "audio/mp4"
export const baseType = (contentType) => String(contentType || '').split(';')[0].trim().toLowerCase()

export const kindForType = (type) => Object.keys(MEDIA).find(k => MEDIA[k].types[type]) || null

// Check the first bytes really are that kind of file, not something renamed
export const looksLike = (type, buf) => {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return false
  const at = (offset, ...bytes) => bytes.every((b, i) => buf[offset + i] === b)
  const ascii = (offset, s) => buf.toString('latin1', offset, offset + s.length) === s
  switch (type) {
    case 'image/jpeg': return at(0, 0xff, 0xd8, 0xff)
    case 'image/png': return at(0, 0x89, 0x50, 0x4e, 0x47)
    case 'image/gif': return ascii(0, 'GIF8')
    case 'image/webp': return ascii(0, 'RIFF') && ascii(8, 'WEBP')
    case 'video/mp4': case 'video/quicktime': case 'audio/mp4': case 'audio/x-m4a':
      return ascii(4, 'ftyp') || ascii(4, 'moov') || ascii(4, 'wide') || ascii(4, 'mdat')
    case 'audio/aac': return buf[0] === 0xff && (buf[1] & 0xf0) === 0xf0
    case 'audio/mpeg': return ascii(0, 'ID3') || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)
    case 'audio/webm': return at(0, 0x1a, 0x45, 0xdf, 0xa3)
    case 'audio/ogg': return ascii(0, 'OggS')
    default: return false
  }
}

export const newMediaPath = (matchId, type) =>
  `${matchId}/${crypto.randomUUID()}.${MEDIA[kindForType(type)].types[type]}`

export const uploadMedia = async (path, buf, type) => {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: type, upsert: false })
  if (error) throw error
}

export const downloadMedia = async (path) => {
  const { data, error } = await supabase.storage.from(BUCKET).download(path)
  if (error || !data) return null
  return Buffer.from(await data.arrayBuffer())
}

// Never throws: a leftover file is better than a failed unsend
export const removeMedia = async (paths) => {
  const list = (paths || []).filter(Boolean)
  if (!list.length) return
  try {
    const { error } = await supabase.storage.from(BUCKET).remove(list)
    if (error) console.error('Remove chat media error:', error.message)
  } catch (err) {
    console.error('Remove chat media error:', err?.message || err)
  }
}
