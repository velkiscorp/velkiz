import { useEffect, useState } from 'react'
import { messagesApi } from '@/api/messages'
import { supabase } from '@/lib/supabase'

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
export const startVoiceRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mimeType = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
    .find(t => window.MediaRecorder?.isTypeSupported?.(t))
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
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
