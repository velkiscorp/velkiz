// Distance helpers for the Discover distance filter.

const EARTH_KM = 6371

// Straight-line distance between two points, in km
export const distanceKm = (lat1, lng1, lat2, lng2) => {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a))
}

// A lat/lng box that contains the whole circle; the database narrows to the
// box quickly, then distanceKm trims the corners
export const boundingBox = (lat, lng, radiusKm) => {
  const dLat = radiusKm / 111.32
  const dLng = radiusKm / (111.32 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01))
  return {
    minLat: Math.max(lat - dLat, -90), maxLat: Math.min(lat + dLat, 90),
    minLng: lng - dLng, maxLng: lng + dLng,
  }
}

// What a card shows: whole km, never "0 km" (that would hint "right here")
export const roundedDistance = (km) => Math.max(1, Math.round(km))
