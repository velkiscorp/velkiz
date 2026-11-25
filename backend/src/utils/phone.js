// Phone-number detection for chat messages.
// Keep PHONE_PATTERN in sync with frontend/src/lib/phone.js.
//
// Matches 7-15 digits that may be separated by spaces, dashes, dots or
// brackets, with an optional leading +. E.g. "+1 (312) 555-0199",
// "312.555.0199", "07700 900123".
export const PHONE_PATTERN = /\+?\(?\d(?:[\s\-.()]*\d){6,14}/g

export const containsPhoneNumber = (text) => {
  if (!text) return false
  PHONE_PATTERN.lastIndex = 0
  return PHONE_PATTERN.test(text)
}
