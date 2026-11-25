// Creates test accounts with finished profiles, straight through the
// Supabase admin API (service key from backend/.env). Accounts are created
// already verified, so no emails are sent and signup rate limits don't apply.
//
//   npm run seed                 50 accounts across all seed cities
//   npm run seed -- --count 10   fewer accounts
//   npm run seed -- --reset      delete every seed account (and its data)
//
// Every seed account is tagged { seed: true } in its auth metadata. --reset
// only ever deletes accounts with that tag. Re-running skips accounts that
// already exist, so it is safe to run twice.
import { supabase } from '../../src/config/supabase.js'
import { deleteAccountData } from '../../src/services/deleteAccount.js'
import { urlForPath } from '../../src/services/photos.js'
import { buildProfile, seedEmail, CITIES } from './profiles.js'
import { placeholderPng } from './placeholderPhoto.js'

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const COUNT = Number(option('count', 50))
const DOMAIN = process.env.SEED_EMAIL_DOMAIN || 'example.com'
const PASSWORD = process.env.SEED_PASSWORD || 'velkiz-seed-2026'
const PHOTOS_PER_PROFILE = 2

if (!Number.isInteger(COUNT) || COUNT < 1 || COUNT > 99) {
  console.error('--count must be a whole number from 1 to 99')
  process.exit(1)
}

// All auth users that carry the seed tag
const listSeedUsers = async () => {
  const found = []
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    found.push(...data.users.filter(u => u.user_metadata?.seed === true))
    if (data.users.length < 1000) return found
  }
}

const uploadPhotos = async (userId, i) => {
  const photos = []
  for (let n = 1; n <= PHOTOS_PER_PROFILE; n++) {
    const path = `${userId}/seed-${n}.png`
    const { error } = await supabase.storage.from('photos')
      .upload(path, placeholderPng(i * 10 + n), { contentType: 'image/png', upsert: true })
    if (error) throw new Error(`photo upload failed: ${error.message}`)
    photos.push({ url: urlForPath(path), is_nsfw: false })
  }
  return photos
}

const seed = async () => {
  const existing = new Map((await listSeedUsers()).map(u => [u.email, u]))
  let created = 0, skipped = 0

  for (let i = 1; i <= COUNT; i++) {
    const email = seedEmail(i, DOMAIN)
    if (existing.has(email)) { skipped++; continue }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { seed: true },
    })
    if (error) throw new Error(`${email}: ${error.message}`)
    const userId = data.user.id

    try {
      const profile = buildProfile(i, { cities: CITIES })
      const photos = await uploadPhotos(userId, i)
      const { error: profileErr } = await supabase.from('profiles').upsert({
        user_id: userId,
        ...profile,
        photos,
        photo_url: photos[0].url,
      }, { onConflict: 'user_id' })
      if (profileErr) throw new Error(`profile: ${profileErr.message}`)
    } catch (err) {
      // Don't leave a login with no profile behind
      await deleteAccountData(userId).catch(() => {})
      throw new Error(`${email}: ${err.message}`)
    }

    created++
    console.log(`created ${email}`)
  }

  console.log(`\nDone: ${created} created, ${skipped} already there.`)
  console.log(`Sign in with seed01@${DOMAIN} ... seed${String(COUNT).padStart(2, '0')}@${DOMAIN}, password from SEED_PASSWORD (default "velkiz-seed-2026").`)
}

const reset = async () => {
  const users = await listSeedUsers()
  for (const u of users) {
    await deleteAccountData(u.id)
    console.log(`deleted ${u.email}`)
  }
  console.log(`\nDone: ${users.length} seed accounts deleted.`)
}

try {
  await (flag('reset') ? reset() : seed())
} catch (err) {
  console.error(`\nSeed failed: ${err.message}`)
  process.exit(1)
}
