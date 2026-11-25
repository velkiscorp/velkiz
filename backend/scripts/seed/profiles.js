// Builds the fake profiles for the seed script. Pure and deterministic: the
// same index always gives the same person, so re-running the seed is stable.
import { GENDERS, ORIENTATIONS, LOOKING_FOR } from '../../src/validation/schemas.js'
import { ageFromDob } from '../../src/utils/age.js'
import { roundForStorage } from '../../src/utils/anonymize.js'

export const CITIES = [
  { city: 'London', country: 'United Kingdom', lat: 51.5072, lng: -0.1276 },
  { city: 'Manchester', country: 'United Kingdom', lat: 53.4808, lng: -2.2426 },
  { city: 'New York', country: 'United States', lat: 40.7128, lng: -74.006 },
  { city: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437 },
  { city: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { city: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777 },
  { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
]

const WORDS = ['velvet', 'midnight', 'silk', 'ember', 'echo', 'lunar', 'quiet', 'neon', 'ghost', 'amber', 'nova', 'drift']
const INTERESTS = ['music', 'travel', 'gaming', 'books', 'cooking', 'hiking', 'art', 'film', 'fitness', 'coffee', 'dancing', 'photography', 'yoga', 'tech', 'fashion', 'nightlife']
const BIOS = [
  'Night owl with a soft spot for vinyl and long walks after midnight.',
  'Here for good conversation first. The rest can wait.',
  'I cook too much food and need someone to help eat it.',
  'Weekend hiker, weekday overthinker.',
  'Ask me about the worst film I love.',
  'Quiet until you get me talking about books.',
  'Coffee snob. Will judge your order, kindly.',
  'Looking for someone who laughs at their own jokes.',
]
const PROMPTS = [
  'The way to win me over is a good playlist.',
  'My most irrational fear is ducks. All of them.',
  'A perfect night is takeaway and a terrible horror film.',
  'I geek out on old maps and train routes.',
  'Two truths and a lie: I have been to 20 countries, I can juggle, I hate chocolate.',
  'You should not go out with me if you hate dogs.',
  'Green flags I look for: people who are kind to waiters.',
  'The key to my heart is remembering small things.',
]

// Orientations that make sense for each gender, so the feed looks realistic
const ORIENTATIONS_FOR = {
  male: ['heterosexual', 'gay', 'bisexual', 'pansexual'],
  female: ['heterosexual', 'lesbian', 'bisexual', 'pansexual'],
  non_binary: ['bisexual', 'pansexual'],
  other: ['bisexual', 'pansexual'],
}

// Small seeded random number generator (mulberry32)
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)]
const pickSome = (rand, list, n) => [...list].sort(() => rand() - 0.5).slice(0, n)

// Date of birth for someone `age` years old today
const dobFor = (age, rand, today) => {
  const d = new Date(Date.UTC(today.getUTCFullYear() - age, today.getUTCMonth(), today.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - 1 - Math.floor(rand() * 300)) // a few months before their birthday
  return d.toISOString().slice(0, 10)
}

// i is 1-based. cities is a list from CITIES; people are spread across them.
export const buildProfile = (i, { cities = [CITIES[0]], today = new Date() } = {}) => {
  const rand = rng(i * 7919)
  // People go round the cities in turn; each lap flips the gender, so every
  // city gets a mix of men and women (plus a few non-binary people)
  const lap = Math.floor((i - 1) / cities.length)
  const gender = i % 10 === 0 ? 'non_binary' : (lap % 2 === 0 ? 'male' : 'female')
  const age = 18 + Math.floor(rand() * 30) // 18 to 47
  const date_of_birth = dobFor(age, rand, today)
  const place = cities[(i - 1) % cities.length]
  // Within about 25 km of the city centre, rounded to ~1 km like real profiles
  const jitter = () => (rand() - 0.5) * 0.45

  return {
    username: `${pick(rand, WORDS)}_${String(i).padStart(2, '0')}`.slice(0, 24),
    bio: pick(rand, BIOS),
    date_of_birth,
    age: ageFromDob(date_of_birth, today),
    show_age: true,
    height_cm: gender === 'male' ? 165 + Math.floor(rand() * 30) : 152 + Math.floor(rand() * 28),
    is_couple: i % 15 === 0,
    hide_city: i % 6 === 0,
    gender,
    orientation: pick(rand, ORIENTATIONS_FOR[gender]),
    looking_for: LOOKING_FOR[(i - 1) % LOOKING_FOR.length],
    interests: pickSome(rand, INTERESTS, 3 + Math.floor(rand() * 4)),
    city: place.city,
    country: place.country,
    location_lat: roundForStorage(place.lat + jitter()),
    location_lng: roundForStorage(place.lng + jitter()),
    ...(([prompt1, prompt2]) => ({ prompt1, prompt2, prompt3: null }))(pickSome(rand, PROMPTS, 2)),
    is_active: true,
    onboarding_complete: true,
  }
}

export const seedEmail = (i, domain) => `seed${String(i).padStart(2, '0')}@${domain}`

// Values the app accepts, re-exported so the test can check against them
export { GENDERS, ORIENTATIONS, LOOKING_FOR }
