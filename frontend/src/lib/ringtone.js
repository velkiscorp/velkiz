// Call sounds, made in code so there are no audio files to ship.
// "incoming" rings on the phone being called; "outgoing" is the ringback the
// caller hears while waiting.

const RATE = 22050

// Segments: [seconds, volume] - volume 0 is silence. The whole pattern loops.
const PATTERNS = {
  incoming: { volume: 0.5, segments: [[0.4, 1], [0.2, 0], [0.4, 1], [2.0, 0]] },
  outgoing: { volume: 0.22, segments: [[1.5, 1], [3.0, 0]] },
}

const wavUrl = ({ volume, segments }) => {
  const total = Math.round(segments.reduce((s, [secs]) => s + secs, 0) * RATE)
  const data = new Int16Array(total)
  let i = 0
  for (const [secs, on] of segments) {
    const n = Math.round(secs * RATE)
    const fade = Math.min(n / 2, RATE * 0.02)
    for (let k = 0; k < n; k++, i++) {
      if (!on) continue
      const t = i / RATE
      // The classic two-tone phone ring, softened at the edges so it doesn't click
      const env = Math.min(1, k / fade, (n - k) / fade)
      const v = (Math.sin(2 * Math.PI * 440 * t) + Math.sin(2 * Math.PI * 480 * t)) / 2
      data[i] = Math.round(v * env * volume * 32767)
    }
  }
  const header = new DataView(new ArrayBuffer(44))
  const str = (o, s) => [...s].forEach((c, j) => header.setUint8(o + j, c.charCodeAt(0)))
  str(0, 'RIFF'); header.setUint32(4, 36 + data.byteLength, true); str(8, 'WAVE')
  str(12, 'fmt '); header.setUint32(16, 16, true); header.setUint16(20, 1, true); header.setUint16(22, 1, true)
  header.setUint32(24, RATE, true); header.setUint32(28, RATE * 2, true); header.setUint16(32, 2, true); header.setUint16(34, 16, true)
  str(36, 'data'); header.setUint32(40, data.byteLength, true)
  return URL.createObjectURL(new Blob([header, data.buffer], { type: 'audio/wav' }))
}

const players = {}

const player = (kind) => {
  if (!players[kind]) {
    const audio = new Audio(wavUrl(PATTERNS[kind]))
    audio.loop = true
    audio.preload = 'auto'
    players[kind] = audio
  }
  return players[kind]
}

// Play one sound (stopping the other). Never throws.
export const playRingtone = (kind) => {
  stopRingtone()
  try {
    const audio = player(kind)
    audio.currentTime = 0
    audio.play()?.catch(() => {})
  } catch {}
}

export const stopRingtone = () => {
  for (const audio of Object.values(players)) {
    try { audio.pause(); audio.currentTime = 0 } catch {}
  }
}
