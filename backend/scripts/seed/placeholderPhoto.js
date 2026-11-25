// Makes a small gradient PNG to stand in for a profile photo. No image
// library needed: a PNG is a few zlib-compressed rows plus checksums.
import { deflateSync } from 'node:zlib'

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

const hsl = (h, s, l) => {
  const a = s * Math.min(l, 1 - l)
  const f = (n) => {
    const k = (n + h / 30) % 12
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
  }
  return [f(0), f(8), f(4)]
}

// Portrait 400x500 gradient whose colours come from `seed`
export const placeholderPng = (seed, width = 400, height = 500) => {
  const hue = (seed * 47) % 360
  const top = hsl(hue, 0.55, 0.35)
  const bottom = hsl((hue + 40) % 360, 0.6, 0.18)

  const raw = Buffer.alloc((width * 3 + 1) * height)
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1)
    const row = y * (width * 3 + 1)
    raw[row] = 0 // no filter
    for (let x = 0; x < width; x++) {
      const o = row + 1 + x * 3
      for (let c = 0; c < 3; c++) raw[o + c] = Math.round(top[c] + (bottom[c] - top[c]) * t)
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
