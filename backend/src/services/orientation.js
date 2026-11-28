import { GENDERS } from '../validation/schemas.js'

// Who someone wants to see in Discover, worked out from their gender and
// orientation. Straight men see women, gay men see men, lesbians see women,
// bi and pan people see everyone. Anything we can't read with confidence
// (non-binary + straight, missing values) falls back to everyone.
export const gendersWantedBy = (gender, orientation) => {
  if (orientation === 'heterosexual') {
    if (gender === 'male') return ['female']
    if (gender === 'female') return ['male']
  }
  if (orientation === 'gay') {
    if (gender === 'male') return ['male']
    if (gender === 'female') return ['female']
  }
  if (orientation === 'lesbian') return ['female']
  return [...GENDERS]
}

const ORIENTATION_VALUES = ['heterosexual', 'gay', 'lesbian', 'bisexual', 'pansexual', null]
const GENDER_VALUES = [...GENDERS, null]
const eqOrNull = (col, v) => (v === null ? `${col}.is.null` : `${col}.eq.${v}`)

// A PostgREST "or" filter matching everyone whose own orientation means
// they'd want to see someone of `myGender`. Keeps Discover two-way: a straight
// man never shows up for a gay man, and the other way round.
export const wantsToSeeFilter = (myGender) => {
  const clauses = []
  for (const orientation of ORIENTATION_VALUES) {
    const genders = GENDER_VALUES.filter(g => gendersWantedBy(g, orientation).includes(myGender))
    if (genders.length === GENDER_VALUES.length) {
      clauses.push(eqOrNull('orientation', orientation))
      continue
    }
    for (const g of genders) clauses.push(`and(${eqOrNull('orientation', orientation)},${eqOrNull('gender', g)})`)
  }
  return clauses.join(',')
}

// Same, but people who picked genders in Filters ("Show me") are matched on
// that choice instead of their orientation. Their choice is saved in
// profiles.show_me (null = follow their orientation).
export const wantsToSeeWithShowMeFilter = (myGender) =>
  `show_me.cs.{${myGender}},and(show_me.is.null,or(${wantsToSeeFilter(myGender)}))`

// Adds the "who you see" rules to a Discover query.
// showMe: genders the person picked in Filters; empty means use their orientation.
// hasShowMeColumn: false until the show_me SQL has run.
export const applyOrientationFilter = (query, me, showMe, { hasShowMeColumn = false } = {}) => {
  const wanted = showMe?.length ? showMe : gendersWantedBy(me?.gender ?? null, me?.orientation ?? null)
  if (wanted.length < GENDERS.length) query = query.in('gender', wanted)
  if (me?.gender) query = query.or(hasShowMeColumn ? wantsToSeeWithShowMeFilter(me.gender) : wantsToSeeFilter(me.gender))
  return query
}

// What to store in profiles.show_me for this Filters choice: null when it
// just follows your orientation, otherwise the genders, sorted
export const showMeToStore = (showMe) => (showMe?.length ? [...new Set(showMe)].sort() : null)
