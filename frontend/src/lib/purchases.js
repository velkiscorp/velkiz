import { isNativeApp } from './native'
import { packSize } from './superLikePacks'

// Buying Super Likes, through Apple, using RevenueCat. Apple only allows
// in-app purchases inside the app, so none of this runs on the website.
//
// The app never adds Super Likes itself: Apple tells RevenueCat, RevenueCat
// tells our server (the webhook in backend superLikeController.js), and the
// server adds them. So someone can't fake a purchase by editing the app.

const API_KEY = import.meta.env.VITE_REVENUECAT_IOS_KEY

export const canBuy = () => isNativeApp() && !!API_KEY

let ready = null
let currentUser = null

// Return the module, never the plugin itself: awaiting a Capacitor plugin
// hangs forever (it answers to "then" like any other method name)
const sdkModule = () => import('@revenuecat/purchases-capacitor')

// Purchases are tied to the Velkiz account (its user id), so they land on the
// right account even if two people share a phone
const setup = async (userId) => {
  const { Purchases } = await sdkModule()
  if (!ready) {
    ready = Purchases.configure({ apiKey: API_KEY, appUserID: userId })
    currentUser = userId
  }
  await ready
  if (currentUser !== userId) {
    await Purchases.logIn({ appUserID: userId })
    currentUser = userId
  }
  return { Purchases }
}

// The packs on sale, cheapest first: [{ pkg, id, count, price }]
export const getPacks = async (userId) => {
  if (!canBuy() || !userId) return []
  const { Purchases } = await setup(userId)
  const offerings = await Purchases.getOfferings()
  const packages = offerings?.current?.availablePackages || []
  return packages
    .map(pkg => ({ pkg, id: pkg.identifier, count: packSize(pkg.product.identifier), price: pkg.product.priceString }))
    .filter(p => p.count)
    .sort((a, b) => a.count - b.count)
}

// Resolves true when bought, false when the person cancelled
export const buyPack = async (userId, pack) => {
  const { Purchases } = await setup(userId)
  try {
    await Purchases.purchasePackage({ aPackage: pack.pkg })
    return true
  } catch (err) {
    if (err?.userCancelled || err?.code === '1' || err?.code === 1) return false
    throw err
  }
}

// On logout, so the next account on this phone starts clean
export const resetPurchases = async () => {
  if (!ready) return
  try { await (await sdkModule()).Purchases.logOut() } catch { /* was never logged in */ }
  currentUser = null
}
