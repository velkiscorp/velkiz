// Profile choices shared by onboarding, My Profile, cards and filters.
// Keep LOOKING_FOR values in sync with backend/src/validation/schemas.js.

export const LOOKING_FOR_OPTIONS = [
  { value: 'long_term', label: 'Long-term', desc: 'Something serious' },
  { value: 'short_term', label: 'Short-term', desc: 'Fun, but not forever' },
  { value: 'casual', label: 'Casual', desc: 'No strings attached' },
  { value: 'online', label: 'Online only', desc: 'Chat and flirt online' },
  { value: 'friends', label: 'Friends', desc: 'Just vibes' },
  { value: 'open', label: 'Open to anything', desc: 'See what happens' },
];

export const lookingForLabel = (value) =>
  LOOKING_FOR_OPTIONS.find(o => o.value === value)?.label || null;

// Height is stored in centimetres; shown as both, e.g. 5'9" (175 cm)
export const MIN_HEIGHT_CM = 120;
export const MAX_HEIGHT_CM = 230;

export const formatHeight = (cm) => {
  if (!cm) return null;
  const totalInches = Math.round(cm / 2.54);
  return `${Math.floor(totalInches / 12)}'${totalInches % 12}" (${cm} cm)`;
};

export const HEIGHT_OPTIONS = Array.from(
  { length: 211 - 140 + 1 },
  (_, i) => 140 + i
).map(cm => ({ value: cm, label: formatHeight(cm) }));

// One interests list for onboarding, My Profile and the Discover filter.
// (Casual isn't here on purpose: it's a "looking for" choice now.)
export const INTEREST_OPTIONS = [
  'Flirting', 'Romantic', 'Romance', 'Sexting', 'Roleplay', 'Kink Friendly', 'BDSM',
  'Dominant', 'Submissive', 'Switch', 'Voyeur', 'Exhibitionist', 'Oral',
  'Late Night Talks', 'Netflix & Chill', 'Spontaneous', 'Open Minded', 'Adventure',
  'Outdoors', 'Travel', 'Music', 'Dancing', 'Art', 'Photography', 'Fitness', 'Foodie',
];

export const DISTANCE_OPTIONS = [10, 25, 50, 100, 250, 500];
