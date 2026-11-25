// Age is always worked out here from the date of birth, never taken from the app

export const MIN_AGE = 18
export const MAX_AGE = 120

// Whole years between a YYYY-MM-DD birth date and today (UTC)
export const ageFromDob = (dob, now = new Date()) => {
  if (!dob) return null
  const [y, m, d] = String(dob).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  let age = now.getUTCFullYear() - y
  const beforeBirthday =
    now.getUTCMonth() + 1 < m || (now.getUTCMonth() + 1 === m && now.getUTCDate() < d)
  if (beforeBirthday) age -= 1
  return age
}

// The age to use for a stored profile. Older accounts made before date of
// birth was stored only have the age number, so fall back to that.
export const profileAge = (profile) => ageFromDob(profile?.date_of_birth) ?? profile?.age ?? null
