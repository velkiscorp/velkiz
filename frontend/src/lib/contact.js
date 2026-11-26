import { LEGAL } from './legal'

// Every "contact us" link in the app goes through here, so the addresses live
// in one place (lib/legal.js).

const mailto = (to, subject, body = '') =>
  `mailto:${to}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`

// A little context helps us answer, without anything personal
const deviceInfo = () => {
  try {
    return `\n\n---\nVelkiz v1.0 · ${navigator.userAgent}`
  } catch {
    return ''
  }
}

export const CONTACT = {
  support: { email: LEGAL.supportEmail, href: mailto(LEGAL.supportEmail, 'Velkiz support') },
  problem: { email: LEGAL.supportEmail, href: mailto(LEGAL.supportEmail, 'Problem in Velkiz', `What happened?\n\n${deviceInfo()}`) },
  safety: { email: LEGAL.supportEmail, href: mailto(LEGAL.supportEmail, 'Safety report', 'Username of the person (if you know it):\n\nWhat happened:\n') },
  privacy: { email: LEGAL.privacyEmail, href: mailto(LEGAL.privacyEmail, 'Privacy request') },
  grievance: { email: LEGAL.grievanceEmail, href: mailto(LEGAL.grievanceEmail, 'Grievance') },
}

// For text that mentions one of our addresses: the matching mailto link
export const hrefForEmail = (email) =>
  Object.values(CONTACT).find(c => c.email === email && c.href)?.href ?? `mailto:${email}`
