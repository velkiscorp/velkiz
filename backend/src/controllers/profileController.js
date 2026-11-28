import { supabase } from '../config/supabase.js'
import { roundForStorage } from '../utils/anonymize.js'
import { toPublicProfile, toOwnProfile } from '../serializers/profile.js'
import { getBlockedUserIds, isBlockedBetween } from '../services/blocks.js'
import { ageFromDob, MIN_AGE, MAX_AGE } from '../utils/age.js'
import { photoAllowedForUser } from '../services/photos.js'
import { applyDiscoverFilters } from '../services/discoverFilters.js'
import { applyOrientationFilter, showMeToStore } from '../services/orientation.js'
import { distanceKm, roundedDistance } from '../utils/geo.js'
import { normalizeInterests } from '../utils/interests.js'

export const getProfiles = async (req, res) => {
  try {
    const currentUserId = req.user.id

    // Validated and defaulted by discoverQuery in routes/profiles.js
    const filters = req.validatedQuery
    const { limit, offset, maxDistanceKm } = filters

    // Your own country and rough location, for "Near me" and distance,
    // and your gender and orientation, for who you see by default
    // select('*') so this still works before the show_me column exists
    const { data: me } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUserId)
      .maybeSingle()

    // Remember who you chose to see, so the two-way check below lets you
    // show up for other people who picked "everyone" too
    const hasShowMeColumn = !!me && 'show_me' in me
    if (hasShowMeColumn) {
      const wanted = showMeToStore(filters.showMe)
      if (JSON.stringify(wanted) !== JSON.stringify(me.show_me ?? null)) {
        await supabase.from('profiles').update({ show_me: wanted }).eq('user_id', currentUserId)
      }
    }

    const { data: mySwipes } = await supabase
      .from('swipes')
      .select('target_id, direction, created_at')
      .eq('swiper_id', currentUserId)

    // Passes made since the app was opened don't hide anyone yet: those
    // people stay in the feed (marked as passed) until the next launch
    const since = filters.passedSince ? new Date(filters.passedSince).getTime() : null
    const passedThisVisit = new Set((mySwipes || [])
      .filter(s => since !== null && s.direction === 'left' && new Date(s.created_at).getTime() >= since)
      .map(s => s.target_id))

    const blockedIds = [...await getBlockedUserIds(currentUserId)]

    const swipedIds = [...new Set([
      ...(mySwipes || []).map(s => s.target_id).filter(id => !passedThisVisit.has(id)),
      ...blockedIds,
    ])]

    swipedIds.push(currentUserId)

    // People who Super Liked you and you haven't answered yet: always at the
    // top of Discover, whatever your filters. They're left out of the normal
    // list (on every page, so paging stays right) and sent on the first page.
    const { data: superSwipes } = await supabase
      .from('swipes')
      .select('*')
      .eq('target_id', currentUserId)
      .eq('direction', 'super')
    const answered = new Set(swipedIds)
    const pendingSupers = (Array.isArray(superSwipes) ? superSwipes : []).filter(s => !answered.has(s.swiper_id))
    swipedIds.push(...pendingSupers.map(s => s.swiper_id))

    let superLikers = []
    if (offset === 0 && pendingSupers.length > 0) {
      const { data: rows } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', pendingSupers.map(s => s.swiper_id))
        .eq('onboarding_complete', true)
        .not('is_active', 'is', false)
      const bySwiper = new Map(pendingSupers.map(s => [s.swiper_id, s]))
      superLikers = (rows || [])
        .map(row => {
          const km = me?.location_lat != null && me?.location_lng != null && row.location_lat != null && row.location_lng != null
            ? distanceKm(me.location_lat, me.location_lng, row.location_lat, row.location_lng)
            : null
          const swipe = bySwiper.get(row.user_id)
          return {
            ...toPublicProfile(row),
            distance_km: km === null ? null : roundedDistance(km),
            superLikedYou: true,
            superLikeMessage: swipe?.message ?? null,
            superLikedAt: swipe?.created_at ?? null,
          }
        })
        .sort((a, b) => new Date(b.superLikedAt || 0) - new Date(a.superLikedAt || 0))
    }

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('onboarding_complete', true)
      // "Pause my profile" in Settings: hidden from Discover (null counts as active)
      .not('is_active', 'is', false)
      // Stable order so paging with offset never skips or repeats people
      .order('created_at', { ascending: true })
      .order('user_id', { ascending: true })
      .range(offset, offset + limit - 1)

    if (swipedIds.length > 0) {
      query = query.not('user_id', 'in', `(${swipedIds.join(',')})`)
    }

    query = applyDiscoverFilters(query, filters, me)
    query = applyOrientationFilter(query, me, filters.showMe, { hasShowMeColumn })

    const { data: profiles, error } = await query

    if (error) {
      console.error('Get profiles error:', error)
      return res.status(500).json({ error: 'Failed to fetch profiles' })
    }

    const hasCoords = (p) => p?.location_lat != null && p?.location_lng != null
    const withDistance = profiles.map(p => ({
      row: p,
      km: hasCoords(me) && hasCoords(p)
        ? distanceKm(me.location_lat, me.location_lng, p.location_lat, p.location_lng)
        : null,
    }))

    // The database narrowed to a box around you; drop the corners outside the circle.
    // filteredOut tells the app how many it skipped, so its next page starts after them.
    const kept = maxDistanceKm && hasCoords(me)
      ? withDistance.filter(x => x.km !== null && x.km <= maxDistanceKm)
      : withDistance

    const sanitized = kept.map(({ row, km }) => ({
      ...toPublicProfile(row),
      distance_km: km === null ? null : roundedDistance(km),
      ...(passedThisVisit.has(row.user_id) ? { passedByYou: true } : {}),
    }))

    // A full page suggests there may be more; a partial page means we hit the end
    res.json({
      superLikers,
      profiles: sanitized,
      filteredOut: withDistance.length - kept.length,
      hasMore: profiles.length === limit,
      // The app sends this back as passedSince for the rest of the visit.
      // A minute early, so a database clock a little behind ours can't hide a pass.
      serverTime: new Date(Date.now() - 60_000).toISOString(),
    })

  } catch (error) {
    console.error('Get profiles error:', error)
    res.status(500).json({ error: 'Failed to fetch profiles' })
  }
}

export const getMyProfile = async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle()

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    res.json({ profile: toOwnProfile(profile) })

  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' })
  }
}

export const updateMyProfile = async (req, res) => {
  try {
    const {
      username, bio, date_of_birth, show_age, height_cm, is_couple, hide_city, gender, orientation, looking_for,
      interests, photos, photo_url, location_lat, location_lng,
      country, city, prompt1, prompt2, prompt3, onboarding_complete, is_active, notify_matches, notify_messages
    } = req.body

    const updates = {
      user_id: req.user.id,
      updated_at: new Date().toISOString()
    }

    if (username !== undefined) updates.username = username
    if (bio !== undefined) updates.bio = bio
    if (show_age !== undefined) updates.show_age = show_age
    if (height_cm !== undefined) updates.height_cm = height_cm
    if (is_couple !== undefined) updates.is_couple = is_couple
    if (hide_city !== undefined) updates.hide_city = hide_city
    if (is_active !== undefined) updates.is_active = is_active
    if (notify_matches !== undefined) updates.notify_matches = notify_matches
    if (notify_messages !== undefined) updates.notify_messages = notify_messages
    if (gender !== undefined) updates.gender = gender
    if (orientation !== undefined) updates.orientation = orientation
    if (looking_for !== undefined) updates.looking_for = looking_for
    if (interests !== undefined) updates.interests = normalizeInterests(interests)
    if (photos !== undefined) updates.photos = photos
    if (photo_url !== undefined) updates.photo_url = photo_url
    if (country !== undefined) updates.country = country
    if (city !== undefined) updates.city = city
    if (prompt1 !== undefined) updates.prompt1 = prompt1
    if (prompt2 !== undefined) updates.prompt2 = prompt2
    if (prompt3 !== undefined) updates.prompt3 = prompt3
    if (onboarding_complete !== undefined) updates.onboarding_complete = onboarding_complete
    // Never keep the exact spot, only a ~1 km rounded one
    if (location_lat !== undefined) updates.location_lat = roundForStorage(location_lat)
    if (location_lng !== undefined) updates.location_lng = roundForStorage(location_lng)

    const needsExisting = date_of_birth !== undefined || onboarding_complete === true ||
      photos !== undefined || photo_url !== undefined || gender !== undefined
    const { data: existing } = needsExisting
      ? await supabase
        .from('profiles')
        .select('date_of_birth, age, onboarding_complete, photos, photo_url, gender')
        .eq('user_id', req.user.id)
        .maybeSingle()
      : { data: null }

    // Gender is set once, during onboarding, and can't be changed after
    if (gender !== undefined && existing?.gender && existing.gender !== gender) {
      return res.status(400).json({ error: "Gender can't be changed" })
    }

    // Photos: only your own uploads (or ones already on your profile), so
    // nobody can put someone else's photo on their profile to get access to it
    const newPhotoUrls = [
      ...(Array.isArray(photos) ? photos.map(p => p.url) : []),
      ...(photo_url ? [photo_url] : []),
    ]
    if (newPhotoUrls.some(url => !photoAllowedForUser(url, req.user.id, existing))) {
      return res.status(400).json({ error: 'You can only use photos you uploaded' })
    }

    // Date of birth: checked here, set once, and the age is derived from it
    if (date_of_birth !== undefined || onboarding_complete === true) {

      const storedDob = existing?.date_of_birth ? String(existing.date_of_birth).slice(0, 10) : null

      if (date_of_birth !== undefined) {
        if (storedDob && storedDob !== date_of_birth) {
          return res.status(400).json({ error: "Date of birth can't be changed" })
        }
        const age = ageFromDob(date_of_birth)
        if (age < MIN_AGE) {
          return res.status(400).json({ error: 'You must be 18 or older to use Velkiz' })
        }
        if (age > MAX_AGE) {
          return res.status(400).json({ error: 'Please enter your real date of birth' })
        }
        if (!storedDob) {
          updates.date_of_birth = date_of_birth
          updates.age = age
        }
      }

      // Nobody finishes onboarding without a date of birth on file
      // (accounts that finished before this existed are left alone)
      const finishingNow = onboarding_complete === true && !existing?.onboarding_complete
      if (finishingNow && !storedDob && !updates.date_of_birth) {
        return res.status(400).json({ error: 'Date of birth is required' })
      }
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(updates, { onConflict: 'user_id' })
      .select()
      .maybeSingle()

    if (error) {
      // profiles_username_key unique constraint
      if (error.code === '23505') {
        return res.status(409).json({ error: 'That username is already taken' })
      }
      console.error('Update profile error:', error)
      return res.status(500).json({ error: 'Failed to update profile' })
    }

    res.json({ profile: toOwnProfile(profile), message: 'Profile updated' })

  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params
    const myId = req.user.id

    if (!UUID_RE.test(id)) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', id)
      .maybeSingle()

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    // Blocked either way: act as if the profile doesn't exist
    if (id !== myId && await isBlockedBetween(myId, id)) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    // Active match between exactly these two users, in either order.
    // (Two chained .or() calls don't reliably express this.)
    const { data: matchRows } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'matched')
      .or(`and(user1_id.eq.${myId},user2_id.eq.${id}),and(user1_id.eq.${id},user2_id.eq.${myId})`)
      .limit(1)

    const isMatched = (matchRows?.length || 0) > 0

    res.json({ profile: toPublicProfile(profile, { level: isMatched || id === myId ? 'match' : 'card' }) })

  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' })
  }
}
