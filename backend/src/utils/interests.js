// Interest tags. The first list had explicit tags (Sexting, BDSM, ...) that
// App Review doesn't allow on a dating app, so they were renamed to softer
// ones. Profiles saved before that may still hold the old names: they are
// shown, saved and filtered under the new names, so nobody sees the old ones.
export const RENAMED_INTERESTS = {
  'Sexting': 'Flirting',
  'Roleplay': 'Playful',
  'Kink Friendly': 'Bold',
  'BDSM': 'Bold',
  'Dominant': 'Confident',
  'Submissive': 'Bold',
  'Switch': 'Bold',
  'Voyeur': 'Playful',
  'Exhibitionist': 'Bold',
  'Oral': 'Playful',
}

// Old names become new ones, without duplicates
export const normalizeInterests = (list) => {
  if (!Array.isArray(list)) return list
  return [...new Set(list.map(tag => RENAMED_INTERESTS[tag] || tag))]
}

// For the Discover filter: a new name also matches profiles that still hold
// any old name it replaced
export const withOldNames = (list) => {
  const names = new Set(normalizeInterests(list))
  for (const [oldName, newName] of Object.entries(RENAMED_INTERESTS)) {
    if (names.has(newName)) names.add(oldName)
  }
  return [...names]
}
