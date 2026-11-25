const MATCH_ANIMATIONS_KEY = 'velvet_match_animations_enabled';

// Defaults to true (full celebration animation) when nothing's been set yet
export const getMatchAnimationsEnabled = () => {
  const stored = localStorage.getItem(MATCH_ANIMATIONS_KEY);
  return stored === null ? true : stored === 'true';
};

export const setMatchAnimationsEnabled = (enabled) => {
  localStorage.setItem(MATCH_ANIMATIONS_KEY, String(enabled));
};