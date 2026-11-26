import { useMemo } from 'react'
import { useMyProfile } from '@/api/queries'

// Show distances, heights, dates and times the way people in your country
// expect: miles in the US and UK, km elsewhere; feet and inches for height in
// the US, UK, Canada and India, cm elsewhere; local date and 12/24-hour time.
//
// Your country comes from your profile (where you live), falling back to the
// phone's region setting. Everything is still stored in km and cm.

const MILES = new Set(['US', 'GB', 'LR', 'MM', 'PR'])
const FEET = new Set(['US', 'GB', 'CA', 'IN', 'LR', 'MM', 'PR'])
const KM_PER_MILE = 1.609344

const ALIASES = {
  'usa': 'US', 'us': 'US', 'united states of america': 'US', 'america': 'US',
  'uk': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB', 'northern ireland': 'GB', 'great britain': 'GB',
  'bharat': 'IN', 'भारत': 'IN',
}

// "India" / "United States" / "Deutschland" -> "IN" / "US" / "DE"
let nameToCode = null
const codeForCountry = (name) => {
  if (!name) return null
  const key = name.trim().toLowerCase()
  if (ALIASES[key]) return ALIASES[key]
  if (!nameToCode) {
    nameToCode = new Map()
    const langs = ['en', ...(typeof navigator !== 'undefined' ? navigator.languages || [] : [])]
    for (const lang of langs) {
      let names
      try { names = new Intl.DisplayNames([lang], { type: 'region' }) } catch { continue }
      for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b)
        try {
          const n = names.of(code)
          // First code wins, so GB beats its old alias UK
          if (n && n !== code && !nameToCode.has(n.toLowerCase())) nameToCode.set(n.toLowerCase(), code)
        } catch { /* not a region */ }
      }
    }
  }
  return nameToCode.get(key) || null
}

const deviceRegion = () => {
  try {
    const lang = navigator.language || 'en-US'
    return new Intl.Locale(lang).maximize().region || null
  } catch {
    return null
  }
}

const inchesText = (cm) => {
  const inches = Math.round(cm / 2.54)
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

export const makeUnits = (region) => {
  const miles = MILES.has(region)
  const feet = FEET.has(region)
  // A locale for dates and times that matches the country, e.g. en-IN
  let locale
  try {
    const lang = new Intl.Locale(navigator.language || 'en').language
    locale = region ? `${lang}-${region}` : undefined
    new Intl.DateTimeFormat(locale)
  } catch {
    locale = undefined
  }

  const timeFmt = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
  const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  return {
    region,
    miles,
    distanceUnit: miles ? 'mi' : 'km',
    // km from the server -> "12 mi" or "19 km"
    distance: (km) => {
      if (km == null) return null
      const n = miles ? Math.max(1, Math.round(km / KM_PER_MILE)) : Math.max(1, Math.round(km))
      return `${n} ${miles ? 'mi' : 'km'}`
    },
    // Choices for the distance filter: labels in your unit, values in km
    distanceOptions: (miles ? [5, 10, 25, 50, 100, 300] : [10, 25, 50, 100, 250, 500])
      .map(n => ({ value: miles ? Math.round(n * KM_PER_MILE) : n, label: `${n} ${miles ? 'mi' : 'km'}` })),
    // On a profile: 5'9" or 175 cm
    height: (cm) => (cm ? (feet ? inchesText(cm) : `${cm} cm`) : null),
    // In a picker, both, your unit first: 5'9" (175 cm) or 175 cm (5'9")
    heightLong: (cm) => (cm ? (feet ? `${inchesText(cm)} (${cm} cm)` : `${cm} cm (${inchesText(cm)})`) : null),
    time: (date) => timeFmt.format(new Date(date)),
    date: (date) => dateFmt.format(new Date(date)),
  }
}

export const useUnits = () => {
  const { data } = useMyProfile()
  const country = data?.profile?.country
  return useMemo(() => makeUnits(codeForCountry(country) || deviceRegion()), [country])
}

export const _test = { codeForCountry }
