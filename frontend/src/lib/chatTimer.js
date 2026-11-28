import { useEffect, useState } from 'react'

// Chats disappear 36 hours after you've both opened them, unless you both
// keep them. These helpers show how long is left.

export const useNow = (everyMs = 30_000) => {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs)
    return () => clearInterval(t)
  }, [everyMs])
  return now
}

// "35h 12m", "47m", "less than a minute"
export const timeLeft = (expiresAt, now = Date.now()) => {
  const ms = new Date(expiresAt).getTime() - now
  if (ms <= 60_000) return 'less than a minute'
  const mins = Math.floor(ms / 60_000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export const hoursLeft = (expiresAt, now = Date.now()) =>
  (new Date(expiresAt).getTime() - now) / 3_600_000
