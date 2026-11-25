// Turns "Chicago, United States" into the city centre's coordinates, for the
// distance filter. Uses OpenStreetMap's free lookup (the same one the
// onboarding city search uses). Returns null if it can't tell.
export const geocodeCity = async (city, country) => {
  if (!city) return null
  try {
    const q = [city, country].filter(Boolean).join(', ')
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
    )
    const [first] = await res.json()
    const lat = parseFloat(first?.lat)
    const lng = parseFloat(first?.lon)
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
  } catch {
    return null
  }
}
