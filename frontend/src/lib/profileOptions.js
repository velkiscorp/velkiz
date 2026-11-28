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

// Height is stored in centimetres. How it's shown (5'9" or 175 cm) depends on
// your country: see lib/units.js.
export const MIN_HEIGHT_CM = 120;
export const MAX_HEIGHT_CM = 230;

export const HEIGHT_OPTIONS = Array.from({ length: 211 - 140 + 1 }, (_, i) => 140 + i);

// One interests list for onboarding, My Profile and the Discover filter.
// (Casual isn't here on purpose: it's a "looking for" choice now.)
export const INTEREST_OPTIONS = [
  'Flirting', 'Romantic', 'Romance', 'Playful', 'Bold', 'Confident', 'Passionate',
  'Late Night Talks', 'Netflix & Chill', 'Spontaneous', 'Open Minded', 'Adventure',
  'Outdoors', 'Travel', 'Music', 'Dancing', 'Art', 'Photography', 'Fitness', 'Foodie',
];

// "Show me" in Discover filters. Values match the backend GENDERS list.
export const SHOW_ME_OPTIONS = [
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];

export const showMeLabel = (values) =>
  values.map(v => SHOW_ME_OPTIONS.find(o => o.value === v)?.label || v).join(', ');
