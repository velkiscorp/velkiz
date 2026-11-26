import { z } from 'zod'

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
// Photos must be files from our own storage bucket. Arbitrary URLs would let a
// user point their profile at their own server and log viewers' IP addresses.
const PHOTO_PREFIX = `${supabaseUrl}/storage/v1/object/public/photos/`

export const uuid = z.string().uuid()

const optionalText = (max) => z.string().trim().max(max).nullable().optional()

const photoUrl = z.string().max(500).refine(
  (url) => url.startsWith(PHOTO_PREFIX),
  { message: 'Photo must be uploaded to Velkis storage' }
)

// ---- auth ----
export const signupBody = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
})

export const resendVerificationBody = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
})

// ---- profiles ----
export const GENDERS = ['male', 'female', 'non_binary', 'other']
export const ORIENTATIONS = ['heterosexual', 'bisexual', 'pansexual', 'gay', 'lesbian']
export const LOOKING_FOR = ['long_term', 'short_term', 'casual', 'online', 'friends', 'open']

// Usernames are lowercase so "mel" and "MEL" can't both exist
export const username = z.string().trim().toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(24, 'Username must be at most 24 characters')
  .regex(/^[a-z0-9_.]+$/, 'Username can only use lowercase letters, numbers, _ and .')

export const dateOfBirth = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`)
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
  }, 'That date of birth is not a real date')

export const updateProfileBody = z.object({
  username: username.optional(),
  bio: optionalText(500),
  // The server works out the age from this and refuses anyone under 18.
  // A real calendar date in YYYY-MM-DD form; it can only be set once.
  date_of_birth: dateOfBirth.optional(),
  show_age: z.boolean().optional(),
  height_cm: z.number().int().min(120, 'Height must be at least 120 cm').max(230, 'Height must be at most 230 cm').nullable().optional(),
  is_couple: z.boolean().optional(),
  hide_city: z.boolean().optional(),
  gender: z.enum(GENDERS).nullable().optional(),
  orientation: z.enum(ORIENTATIONS).nullable().optional(),
  looking_for: z.enum(LOOKING_FOR).nullable().optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(20).nullable().optional(),
  photos: z.array(z.object({
    url: photoUrl,
    is_nsfw: z.boolean().optional().default(false),
  })).max(4).nullable().optional(),
  photo_url: z.union([photoUrl, z.literal('')]).nullable().optional(),
  location_lat: z.number().min(-90).max(90).nullable().optional(),
  location_lng: z.number().min(-180).max(180).nullable().optional(),
  country: optionalText(100),
  city: optionalText(100),
  prompt1: optionalText(300),
  prompt2: optionalText(300),
  prompt3: optionalText(300),
  onboarding_complete: z.boolean().optional(),
})

// "a,b,c" in the URL -> ['a', 'b', 'c']
const csv = (item, max) => z.string().max(2000).optional()
  .transform(v => (v ? v.split(',').map(s => s.trim()).filter(Boolean) : undefined))
  .pipe(z.array(item).max(max).optional())

const optionalInt = (min, max) => z.coerce.number().int().min(min).max(max).optional()

export const discoverQuery = z.object({
  lookingFor: csv(z.enum(LOOKING_FOR), LOOKING_FOR.length),
  interests: csv(z.string().min(1).max(40), 20),
  minAge: optionalInt(18, 120),
  maxAge: optionalInt(18, 120),
  minHeight: optionalInt(120, 230),
  maxHeight: optionalInt(120, 230),
  maxDistanceKm: optionalInt(1, 20000),
  sameRegion: z.enum(['true', 'false']).optional(),
  // Genders to show; left out, it follows your orientation
  showMe: csv(z.enum(GENDERS), GENDERS.length),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  offset: z.coerce.number().int().min(0).max(10000).optional().default(0),
})

export const idParams = z.object({ id: uuid })

// Deleting your account needs your password again, so someone holding an
// unlocked phone or a stolen session can't wipe it
export const deleteAccountBody = z.object({
  password: z.string().min(1, 'Enter your password').max(72),
})

// ---- swipes ----
export const swipeBody = z.object({
  targetId: uuid,
  direction: z.enum(['left', 'right', 'super']),
})

export const targetIdParams = z.object({ targetId: uuid })

// ---- matches & messages ----
export const matchIdParams = z.object({ matchId: uuid })

export const sendMessageBody = z.object({
  content: z.string().trim()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message is too long (2000 characters max)'),
})

// ---- safety (report & block) ----
export const REPORT_REASONS = [
  'fake_profile', 'harassment', 'inappropriate_photos', 'underage',
  'spam_or_scam', 'hate_speech', 'threats_or_violence', 'other',
]

export const userIdParams = z.object({ userId: uuid })

export const blockBody = z.object({ userId: uuid })

export const reportBody = z.object({
  userId: uuid,
  reason: z.enum(REPORT_REASONS),
  details: optionalText(1000),
  // The chat it happened in, so a reviewer can read the messages
  matchId: uuid.optional(),
  // Reporting blocks the person too unless you untick it
  alsoBlock: z.boolean().optional().default(true),
})
