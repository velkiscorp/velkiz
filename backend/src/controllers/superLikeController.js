import { timingSafeEqual } from 'node:crypto'
import { getBalance, addPurchase, refundPurchase, packSize } from '../services/superLikes.js'
import { uuid } from '../validation/schemas.js'

// GET /api/super-likes - how many I have
export const getMySuperLikes = async (req, res) => {
  try {
    res.json(await getBalance(req.user.id))
  } catch (error) {
    console.error('Super Like balance error:', error)
    res.status(500).json({ error: 'Failed to load Super Likes' })
  }
}

const secretMatches = (given) => {
  const expected = process.env.REVENUECAT_WEBHOOK_SECRET
  if (!expected || typeof given !== 'string') return false
  const a = Buffer.from(given.replace(/^Bearer\s+/i, ''))
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// POST /api/purchases/revenuecat - RevenueCat tells us about App Store
// purchases here. It sends the secret we set in its dashboard in the
// Authorization header; anything without it is ignored.
// Always answer 200 for events we've understood or chosen to skip, otherwise
// RevenueCat keeps retrying them.
export const revenuecatWebhook = async (req, res) => {
  if (!secretMatches(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const event = req.body?.event
  if (!event || typeof event !== 'object') return res.status(400).json({ error: 'No event' })

  try {
    const { type, app_user_id: userId, product_id: productId, transaction_id: transactionId, store } = event

    if (type === 'NON_RENEWING_PURCHASE') {
      const quantity = packSize(productId)
      if (!quantity || !transactionId || !uuid.safeParse(userId).success) {
        console.warn('Skipped purchase event:', { type, productId, hasTransaction: !!transactionId })
        return res.json({ ok: true, skipped: true })
      }
      const added = await addPurchase({ transactionId: String(transactionId), userId, productId, quantity, store })
      return res.json({ ok: true, added })
    }

    // Apple refunded a one-time purchase
    if (type === 'CANCELLATION' && packSize(productId) && transactionId) {
      const refunded = await refundPurchase(String(transactionId))
      return res.json({ ok: true, refunded })
    }

    // TEST events from the dashboard, subscriptions (not sold yet), etc.
    res.json({ ok: true, skipped: true })
  } catch (error) {
    console.error('RevenueCat webhook error:', error)
    // 500 makes RevenueCat retry later, which is what we want if the
    // database was briefly unreachable
    res.status(500).json({ error: 'Failed to process event' })
  }
}
