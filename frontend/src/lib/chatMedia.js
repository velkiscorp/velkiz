import { useEffect, useState } from 'react'
import { messagesApi } from '@/api/messages'
import { supabase } from '@/lib/supabase'
import { Capacitor, registerPlugin } from '@capacitor/core'

// Photos, videos and voice messages in chats. Files are private: the app
// downloads each one with your login and keeps it only as a temporary blob:
// URL, so there's never a link that could be shared.

export const MAX_VIDEO_BYTES = 25 * 1024 * 1024
export const MAX_VOICE_SECONDS = 120

const cache = new Map() // messageId -> Promise<blob: URL | null>

export const loadChatMedia = (matchId, messageId) => {
  if (!cache.has(messageId)) {
    const p = messagesApi.getMedia(matchId, messageId)
      .then(blob => URL.createObjectURL(blob))
      .catch(() => { cache.delete(messageId); return null })
    cache.set(messageId, p)
  }
  return cache.get(messageId)
}

// Your own upload can be shown straight away from the file you picked
export const primeChatMedia = (messageId, blob) => {
  cache.set(messageId, Promise.resolve(URL.createObjectURL(blob)))
}

export const forgetChatMedia = (messageId) => {
  const p = cache.get(messageId)
  cache.delete(messageId)
  p?.then(u => u && URL.revokeObjectURL(u))
}

supabase.auth.onAuthStateChange((event) => {
  if (event !== 'SIGNED_OUT') return
  for (const id of [...cache.keys()]) forgetChatMedia(id)
})

export const useChatMedia = (matchId, messageId) => {
  const [state, setState] = useState({ id: null, src: null, failed: false })
  useEffect(() => {
    let cancelled = false
    loadChatMedia(matchId, messageId).then(src => {
      if (!cancelled) setState({ id: messageId, src, failed: !src })
    })
    return () => { cancelled = true }
  }, [matchId, messageId])
  return state.id === messageId ? state : { src: null, failed: false }
}

// Shrink a photo to at most 1600px and re-save it as JPEG. Re-drawing it
// also drops the hidden details phones add to photos, like where it was taken.
export const preparePhoto = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => {
    URL.revokeObjectURL(url)
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not read that photo'))), 'image/jpeg', 0.85)
  }
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that photo')) }
  img.src = url
})

// Length of a video file, in seconds (null if it can't be read)
export const videoDuration = (file) => new Promise((resolve) => {
  const url = URL.createObjectURL(file)
  const v = document.createElement('video')
  v.preload = 'metadata'
  v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(Number.isFinite(v.duration) ? v.duration : null) }
  v.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
  v.src = url
})

// Voice recording. iPhones record AAC in an .m4a (audio/mp4).
// 48 kHz mono at 128 kbps, with the phone cleaning up echo and background
// noise: much clearer than the browser default, and still only ~1 MB a minute.
export const startVoiceRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000 },
  })
  const mimeType = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
    .find(t => window.MediaRecorder?.isTypeSupported?.(t))
  const recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 128000 })
  const chunks = []
  recorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data) }
  const startedAt = Date.now()
  recorder.start(250)

  const release = () => stream.getTracks().forEach(t => t.stop())

  return {
    startedAt,
    // Resolves { blob, duration }
    stop: () => new Promise((resolve) => {
      recorder.onstop = () => {
        release()
        const type = (recorder.mimeType || mimeType || 'audio/mp4').split(';')[0]
        resolve({ blob: new Blob(chunks, { type }), duration: (Date.now() - startedAt) / 1000 })
      }
      if (recorder.state !== 'inactive') recorder.stop()
      else recorder.onstop()
    }),
    cancel: () => {
      recorder.onstop = release
      if (recorder.state !== 'inactive') recorder.stop()
      else release()
    },
  }
}

export const formatSeconds = (secs) => {
  const s = Math.max(0, Math.round(secs || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Pick one photo or video. In the iPhone app this opens Apple's picker
// (MediaPicker.swift): no permission prompt, and it closes as soon as
// something is tapped. Resolves a File, or null if they backed out.
// On the web, onWeb() opens a normal file input instead.
const MediaPicker = registerPlugin('MediaPicker')

export const pickPhotoOrVideo = async (onWeb) => {
  if (!Capacitor.isNativePlatform()) { onWeb?.(); return null }
  const picked = await MediaPicker.pick()
  if (!picked || picked.cancelled || !picked.webPath) return null
  const blob = await (await fetch(picked.webPath)).blob()
  const ext = picked.ext || (picked.isVideo ? 'mov' : 'jpg')
  const type = picked.isVideo
    ? (ext === 'mp4' || ext === 'm4v' ? 'video/mp4' : 'video/quicktime')
    : ({ png: 'image/png', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic' }[ext] || 'image/jpeg')
  return new File([blob], `media.${ext}`, { type })
}

// A tiny (32 px) JPEG of a photo or a video's first frame. It's sent along
// with the file and shown heavily blurred on view-once messages, so the
// other person gets a hint of colour without seeing anything.
export const makePreview = (blob) => new Promise((resolve) => {
  const url = URL.createObjectURL(blob)
  const done = (value) => { URL.revokeObjectURL(url); resolve(value) }
  const draw = (el, w, h) => {
    try {
      if (!w || !h) return done(null)
      const scale = 32 / Math.max(w, h)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(w * scale))
      canvas.height = Math.max(1, Math.round(h * scale))
      canvas.getContext('2d').drawImage(el, 0, 0, canvas.width, canvas.height)
      done(canvas.toDataURL('image/jpeg', 0.6))
    } catch { done(null) }
  }
  const timer = setTimeout(() => done(null), 5000)
  if (blob.type.startsWith('video/')) {
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.preload = 'auto'
    v.onloadeddata = () => { v.currentTime = Math.min(0.1, v.duration || 0) }
    v.onseeked = () => { clearTimeout(timer); draw(v, v.videoWidth, v.videoHeight) }
    v.onerror = () => { clearTimeout(timer); done(null) }
    v.src = url
  } else {
    const img = new Image()
    img.onload = () => { clearTimeout(timer); draw(img, img.naturalWidth, img.naturalHeight) }
    img.onerror = () => { clearTimeout(timer); done(null) }
    img.src = url
  }
})
