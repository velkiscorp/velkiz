// Keep PHONE_PATTERN in sync with backend/src/utils/phone.js.
export const PHONE_PATTERN = /\+?\(?\d(?:[\s\-.()]*\d){6,14}/g;

// Split text into plain parts and phone-number parts so the UI can mask them.
// Returns [{ text, isPhone }]
export const splitPhoneNumbers = (text = '') => {
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(PHONE_PATTERN)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), isPhone: false });
    parts.push({ text: match[0], isPhone: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), isPhone: false });
  return parts;
};

// "+1 (312) 555-0199" -> "+• (•••) •••-••99": keep separators and last 2 digits
export const maskPhoneNumber = (phone) => {
  const totalDigits = (phone.match(/\d/g) || []).length;
  let seen = 0;
  return phone.replace(/\d/g, (d) => (++seen > totalDigits - 2 ? d : '•'));
};
