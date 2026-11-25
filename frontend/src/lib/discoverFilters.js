// Discover filters: defaults, saving them on this device, and turning them
// into the query the backend expects.

const KEY = 'velkis_discover_filters'

export const EMPTY_FILTERS = {
  lookingFor: [],
  interests: [],
  minAge: null,
  maxAge: null,
  maxDistanceKm: null,
  minHeight: null,
  maxHeight: null,
  sameRegion: false,
  // Genders to show. Empty means "based on my orientation" (the default).
  showMe: [],
}

export const loadFilters = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    return saved ? { ...EMPTY_FILTERS, ...saved } : EMPTY_FILTERS
  } catch {
    return EMPTY_FILTERS
  }
}

export const saveFilters = (filters) => {
  try { localStorage.setItem(KEY, JSON.stringify(filters)) } catch { /* private mode */ }
}

// How many filters are on (for the badge on the Filters button)
export const countFilters = (f) =>
  (f.lookingFor.length ? 1 : 0) + (f.interests.length ? 1 : 0) +
  (f.minAge || f.maxAge ? 1 : 0) + (f.minHeight || f.maxHeight ? 1 : 0) +
  (f.maxDistanceKm ? 1 : 0) + (f.sameRegion ? 1 : 0) + (f.showMe.length ? 1 : 0)

export const toQueryParams = (f) => ({
  lookingFor: f.lookingFor.length ? f.lookingFor.join(',') : undefined,
  interests: f.interests.length ? f.interests.join(',') : undefined,
  minAge: f.minAge || undefined,
  maxAge: f.maxAge || undefined,
  minHeight: f.minHeight || undefined,
  maxHeight: f.maxHeight || undefined,
  maxDistanceKm: f.maxDistanceKm || undefined,
  sameRegion: f.sameRegion ? 'true' : undefined,
  showMe: f.showMe.length ? f.showMe.join(',') : undefined,
})
