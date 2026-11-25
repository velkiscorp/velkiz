import { profileAge } from '../utils/age.js'
import { fuzzyLocation } from '../utils/anonymize.js'

// The ONE way a profile leaves the server for someone else to see.
// Every endpoint (Discover, Likes, Matches, profile sheet, match popup)
// uses this, so the app always gets the same fields with the same names.
//
// level 'card'  - anyone who may see you (Discover, Likes)
// level 'match' - people you've matched with: adds the personal details
//
// Never included: email, exact location, date of birth, phone, internal flags.
export const toPublicProfile = (row, { level = 'card' } = {}) => {
  if (!row) return null

  const profile = {
    id: row.user_id,
    username: row.username,
    age: row.show_age ? profileAge(row) : null,
    bio: row.bio ?? null,
    photos: Array.isArray(row.photos) ? row.photos : [],
    looking_for: row.looking_for ?? null,
    interests: Array.isArray(row.interests) ? row.interests : [],
    height_cm: row.height_cm ?? null,
    is_couple: row.is_couple === true,
    // "Hide my city": others only see the country and how far away you are
    city: row.hide_city ? null : (row.city ?? null),
    country: row.country ?? null,
    location: (row.location_lat != null && row.location_lng != null)
      ? fuzzyLocation(row.location_lat, row.location_lng)
      : null,
  }

  if (level === 'match') {
    Object.assign(profile, {
      gender: row.gender ?? null,
      orientation: row.orientation ?? null,
      prompt1: row.prompt1 ?? null,
      prompt2: row.prompt2 ?? null,
      prompt3: row.prompt3 ?? null,
      // No dedicated last_seen column yet; updated_at is what last-seen writes
      last_seen: row.updated_at ?? null,
    })
  }

  return profile
}

// Your own profile, as the edit screens need it: every column, plus the
// age worked out from the date of birth
export const toOwnProfile = (row) => row && { ...row, age: profileAge(row) }
