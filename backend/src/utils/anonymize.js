// Rough location for other people to see: snapped to a fixed grid of about
// 5 km. The same spot always gives the same answer, unlike a fresh random
// offset each time, which can be averaged back to the real spot over many
// loads. When someone moves (or travels), their grid square moves with them.
const PUBLIC_GRID = 0.05 // degrees, about 5.5 km north-south

const snap = (value, step) => {
  const snapped = Math.floor(value / step) * step + step / 2 // centre of the square
  return parseFloat(snapped.toFixed(4))
}

export const fuzzyLocation = (lat, lng) => ({
  lat: snap(lat, PUBLIC_GRID),
  lng: snap(lng, PUBLIC_GRID),
})

// What gets stored: rounded to about 1 km, so the exact spot is never kept
export const STORED_PRECISION = 2 // decimal places
export const roundForStorage = (value) =>
  value == null ? value : parseFloat(Number(value).toFixed(STORED_PRECISION))
