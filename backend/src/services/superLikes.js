import { supabase } from '../config/supabase.js'

// Super Likes: everyone gets one free every 24 hours, and can buy packs in the
// iPhone app. The counting happens in the database (see the super_likes
// migration) so two taps at once can't spend the same one twice.

export const FREE_EVERY_MS = 24 * 60 * 60 * 1000

// App Store product ids end in the pack size, e.g. velkiz_superlikes_5
export const packSize = (productId) => {
  const n = Number(/super_?likes?_(\d+)$/i.exec(productId || '')?.[1])
  return Number.isInteger(n) && n > 0 && n <= 100 ? n : null
}

// Returns 'free', 'purchased', or null when there are none left
export const useSuperLike = async (userId) => {
  const { data, error } = await supabase.rpc('use_super_like', { p_user: userId })
  if (error) throw error
  return data || null
}

export const refundSuperLike = async (userId, kind) => {
  const { error } = await supabase.rpc('refund_super_like', { p_user: userId, p_kind: kind })
  if (error) console.error('Super Like refund failed:', error.message)
}

export const getBalance = async (userId) => {
  const { data } = await supabase
    .from('super_like_balances')
    .select('purchased, free_used_at')
    .eq('user_id', userId)
    .maybeSingle()

  const usedAt = data?.free_used_at ? new Date(data.free_used_at).getTime() : 0
  const nextFree = usedAt + FREE_EVERY_MS
  const freeAvailable = !usedAt || nextFree <= Date.now()
  const purchased = data?.purchased ?? 0
  return {
    freeAvailable,
    nextFreeAt: freeAvailable ? null : new Date(nextFree).toISOString(),
    purchased,
    total: purchased + (freeAvailable ? 1 : 0),
  }
}

// Returns true if this purchase was new (false if already counted)
export const addPurchase = async ({ transactionId, userId, productId, quantity, store }) => {
  const { data, error } = await supabase.rpc('add_super_like_purchase', {
    p_transaction: transactionId, p_user: userId, p_product: productId, p_quantity: quantity, p_store: store ?? null,
  })
  if (error) throw error
  return !!data
}

export const refundPurchase = async (transactionId) => {
  const { data, error } = await supabase.rpc('refund_super_like_purchase', { p_transaction: transactionId })
  if (error) throw error
  return !!data
}
