// Emails the app sends itself (not the login emails, which Supabase sends).
// Uses Resend's API with RESEND_API_KEY. Without a key nothing is sent, so
// local development and tests never email anyone.

const FROM = process.env.EMAIL_FROM || 'Velkiz <no-reply@support.velkiz.com>'

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
))

// Plain text, shown as-is in the HTML version too (escaped, line breaks kept)
export const sendEmail = async ({ to, subject, text, replyTo }) => {
  const key = process.env.RESEND_API_KEY
  if (!key || !to) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.5;white-space:pre-wrap">${escapeHtml(text)}</div>`,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.error('Email failed:', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (e) {
    console.error('Email failed:', e.message)
    return false
  }
}
