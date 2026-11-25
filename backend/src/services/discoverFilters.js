import { boundingBox } from '../utils/geo.js'

// Date that someone born on it turns `years` old today, as YYYY-MM-DD
const birthdayFor = (years, today) => {
  const d = new Date(Date.UTC(today.getUTCFullYear() - years, today.getUTCMonth(), today.getUTCDate()))
  return d.toISOString().slice(0, 10)
}

// Adds the Discover filters to a profiles query. Everything is done in the
// database so paging stays correct; only the exact distance is checked after.
export const applyDiscoverFilters = (query, filters, me, today = new Date()) => {
  const { lookingFor, interests, minAge, maxAge, minHeight, maxHeight, maxDistanceKm, sameRegion } = filters

  if (lookingFor?.length) query = query.in('looking_for', lookingFor)
  if (interests?.length) query = query.overlaps('interests', interests)

  if (minHeight) query = query.gte('height_cm', minHeight)
  if (maxHeight) query = query.lte('height_cm', maxHeight)

  if (minAge || maxAge) {
    const lo = minAge || 18
    const hi = maxAge || 120
    // Born on or before the day they turned `lo`, and after the day they'd turn hi+1.
    // Older accounts without a date of birth fall back to the age column.
    const latestDob = birthdayFor(lo, today)
    const earliestDob = birthdayFor(hi + 1, today)
    query = query.or(
      `and(date_of_birth.lte.${latestDob},date_of_birth.gt.${earliestDob}),` +
      `and(date_of_birth.is.null,age.gte.${lo},age.lte.${hi})`
    )
  }

  if (sameRegion === 'true' && me?.country) query = query.eq('country', me.country)

  if (maxDistanceKm && me?.location_lat != null && me?.location_lng != null) {
    const box = boundingBox(me.location_lat, me.location_lng, maxDistanceKm)
    query = query
      .gte('location_lat', box.minLat).lte('location_lat', box.maxLat)
      .gte('location_lng', box.minLng).lte('location_lng', box.maxLng)
  }

  return query
}
