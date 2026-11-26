// App Store product ids end in the pack size, e.g. velkiz_superlikes_5.
// The server reads them the same way (backend services/superLikes.js).
export const packSize = (productId) => {
  const n = Number(/super_?likes?_(\d+)$/i.exec(productId || '')?.[1])
  return Number.isInteger(n) && n > 0 && n <= 100 ? n : null
}
