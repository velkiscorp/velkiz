import { supabase } from '../config/supabase.js'
import { notifyUser } from '../services/push.js'
import { containsPhoneNumber } from '../utils/phone.js'
import { markOpened, isExpired, expireMatch, timerFor } from '../services/chatExpiry.js'
import { MEDIA, baseType, kindForType, looksLike, newMediaPath, uploadMedia, downloadMedia, removeMedia } from '../services/chatMedia.js'


// GET ALL MESSAGES IN A MATCH
export const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params
    const userId = req.user.id

    // Verify user is part of this match
    const { data: found } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single()

    if (!found) {
      return res.status(404).json({ error: 'Match not found' })
    }

    if (found.status === 'unmatched') {
      return res.status(403).json({ error: 'This match no longer exists' })
    }

    // Its 36 hours ran out: it's gone
    if (isExpired(found)) {
      await expireMatch(found, req.app.get('io'))
      return res.status(404).json({ error: 'This chat disappeared', code: 'CHAT_EXPIRED' })
    }

    // Opening the chat: once you've both opened it, its 36 hours start
    const match = await markOpened(found, userId, req.app.get('io'))

    // Get all messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*') // includes kind once the screenshot-alerts SQL has run
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (error) {
      return res.status(500).json({ error: 'Failed to get messages' })
    }

    // Mark unread messages as read
    const unreadIds = messages
      .filter(m => m.sender_id !== userId && !m.read_at)
      .map(m => m.id)

    if (unreadIds.length > 0) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds)
    }

    // Add isMine flag so frontend knows which side to render
    const enriched = messages.map(m => ({
      ...m,
      isMine: m.sender_id === userId
    }))

    res.json({ messages: enriched, timer: timerFor(match, userId) })

  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
}

// SEND A MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const { matchId } = req.params
    const { content, replyToId } = req.body
    const userId = req.user.id

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' })
    }

    // Verify user is part of this match
    const { data: match } = await supabase
      .from('matches')
      .select('id, user1_id, user2_id, status')
      .eq('id', matchId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single()

    if (!match) {
      return res.status(404).json({ error: 'Match not found' })
    }

    if (match.status === 'unmatched') {
      return res.status(403).json({ error: 'Cannot message an unmatched user' })
    }



    // A reply must point at a message in this same chat
    if (replyToId) {
      const { data: original } = await supabase
        .from('messages')
        .select('id')
        .eq('id', replyToId)
        .eq('match_id', matchId)
        .maybeSingle()
      if (!original) {
        return res.status(400).json({ error: 'The message you replied to is gone' })
      }
    }

    // Save to database
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        ...(replyToId ? { reply_to_id: replyToId } : {}),
        match_id: matchId,
        sender_id: userId,
        content: content.trim(),
        // Flag messages with a phone number: the chat masks the number until
        // the reader taps to reveal it, and shows a safety note
        is_filtered: containsPhoneNumber(content)
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to send message' })
    }


    // Push to anyone else currently in this match's room. isMine is left out -
    // it's relative to whoever receives it, so the frontend computes it locally
    // by comparing sender_id to its own user id.
    const io = req.app.get('io')
    io?.to(matchId).emit('receive_message', message)

    // And a push notification to the other person's phone (no text in it)
    const recipientId = match.user1_id === userId ? match.user2_id : match.user1_id
    notifyUser(recipientId, 'message', { matchId })

    res.status(201).json({
      message: {
        ...message,
        isMine: true
      }
    })

  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
}
const SCREENSHOT_REPEAT_MS = 5000

// POST /api/messages/:matchId/screenshot
// The iPhone app calls this when someone screenshots a chat. Screenshots come
// out blank, but the other person still deserves to know someone tried.
export const reportScreenshot = async (req, res) => {
  try {
    const { matchId } = req.params
    const userId = req.user.id

    const { data: match } = await supabase
      .from('matches')
      .select('id, user1_id, user2_id, status')
      .eq('id', matchId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single()

    if (!match || match.status !== 'matched') {
      return res.status(404).json({ error: 'Match not found' })
    }

    // One screenshot can be reported more than once (iOS sometimes repeats
    // it). Within a few seconds, reuse the notice already in the chat.
    const { data: recent } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .eq('sender_id', userId)
      .eq('kind', 'screenshot')
      .gte('created_at', new Date(Date.now() - SCREENSHOT_REPEAT_MS).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (recent?.id) return res.json({ message: { ...recent, isMine: true } })

    const { data: message, error } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: userId, content: 'Tried to take a screenshot', kind: 'screenshot' })
      .select()
      .single()

    if (error) {
      console.error('Screenshot alert error:', error)
      return res.status(500).json({ error: 'Failed to record screenshot' })
    }

    req.app.get('io')?.to(matchId).emit('receive_message', message)
    const recipientId = match.user1_id === userId ? match.user2_id : match.user1_id
    notifyUser(recipientId, 'screenshot', { matchId })

    res.status(201).json({ message: { ...message, isMine: true } })
  } catch (error) {
    console.error('Screenshot alert error:', error)
    res.status(500).json({ error: 'Failed to record screenshot' })
  }
}

// Shared by unsend and clear: you must be in this match, and it must still exist
const findMyMatch = async (matchId, userId) => {
  const { data: match } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id, status')
    .eq('id', matchId)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .single()
  return match && match.status === 'matched' ? match : null
}

// DELETE /api/messages/:matchId/:messageId
// Unsend: your own message disappears for both of you, like Instagram
export const unsendMessage = async (req, res) => {
  try {
    const { matchId, messageId } = req.params
    const userId = req.user.id

    if (!await findMyMatch(matchId, userId)) {
      return res.status(404).json({ error: 'Match not found' })
    }

    const { data: deleted, error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('match_id', matchId)
      .eq('sender_id', userId)
      .in('kind', ['text', 'image', 'video', 'audio'])
      .select('id, media_path')

    if (error) {
      console.error('Unsend error:', error)
      return res.status(500).json({ error: 'Failed to unsend' })
    }
    if (!deleted?.length) {
      return res.status(404).json({ error: 'Message not found' })
    }

    removeMedia(deleted.map(m => m.media_path))
    req.app.get('io')?.to(matchId).emit('message_deleted', { matchId, messageId })
    res.json({ ok: true })
  } catch (error) {
    console.error('Unsend error:', error)
    res.status(500).json({ error: 'Failed to unsend' })
  }
}

// DELETE /api/messages/:matchId
// Delete the whole chat for both of you. The match stays, so you can keep talking.
export const clearChat = async (req, res) => {
  try {
    const { matchId } = req.params
    const userId = req.user.id

    if (!await findMyMatch(matchId, userId)) {
      return res.status(404).json({ error: 'Match not found' })
    }

    const { data: deleted, error } = await supabase
      .from('messages')
      .delete()
      .eq('match_id', matchId)
      .select('media_path')

    if (error) {
      console.error('Clear chat error:', error)
      return res.status(500).json({ error: 'Failed to delete chat' })
    }

    removeMedia((deleted || []).map(m => m.media_path))
    req.app.get('io')?.to(matchId).emit('chat_cleared', { matchId })
    res.json({ ok: true })
  } catch (error) {
    console.error('Clear chat error:', error)
    res.status(500).json({ error: 'Failed to delete chat' })
  }
}

// POST /api/messages/:matchId/media?replyToId=&duration=&keep=
// Body: the file itself (a photo, video or voice message), with its
// Content-Type. Saved privately. Photos and videos are view-once (the
// other person can open it one time, then it's deleted) unless keep=true.
export const sendMedia = async (req, res) => {
  try {
    const { matchId } = req.params
    const { replyToId, duration, keep } = req.validatedQuery || {}
    const userId = req.user.id

    const type = baseType(req.get('content-type'))
    const kind = kindForType(type)
    const buf = req.body
    if (!kind || !Buffer.isBuffer(buf) || buf.length === 0) {
      return res.status(400).json({ error: 'Send a photo, video or voice message' })
    }
    if (buf.length > MEDIA[kind].max) {
      return res.status(413).json({ error: `That ${MEDIA[kind].label.toLowerCase()} is too big` })
    }
    if (!looksLike(type, buf)) {
      return res.status(400).json({ error: "That file doesn't look right. Try another one." })
    }

    const match = await findMyMatch(matchId, userId)
    if (!match) return res.status(404).json({ error: 'Match not found' })

    if (replyToId) {
      const { data: original } = await supabase
        .from('messages').select('id').eq('id', replyToId).eq('match_id', matchId).maybeSingle()
      if (!original) return res.status(400).json({ error: 'The message you replied to is gone' })
    }

    const path = newMediaPath(matchId, type)
    await uploadMedia(path, buf, type)

    const row = {
      match_id: matchId,
      sender_id: userId,
      kind,
      // Shown in the Messages list and anywhere the file can't be
      content: MEDIA[kind].label,
      media_path: path,
      media_type: type,
      ...(duration ? { media_duration: duration } : {}),
      ...(replyToId ? { reply_to_id: replyToId } : {}),
    }
    const viewOnce = kind !== 'audio' && keep !== 'true'
    // A tiny blurry preview made by the app (X-Media-Preview header), shown
    // blurred over a view-once message until it's opened
    const preview = kind !== 'audio' ? validPreview(req.get('x-media-preview')) : null
    const insert = (r) => supabase.from('messages').insert(r).select().single()
    const full = { ...row, ...(viewOnce ? { view_once: true } : {}), ...(preview ? { media_preview: preview } : {}) }
    let { data: message, error } = await insert(full)
    // Before the newer SQL has run those columns don't exist: send it as a normal one
    if (error && full !== row && /view_once|media_preview/.test(error.message || '')) {
      ({ data: message, error } = await insert(row))
    }

    if (error) {
      removeMedia([path])
      console.error('Send media error:', error)
      return res.status(500).json({ error: 'Failed to send' })
    }

    req.app.get('io')?.to(matchId).emit('receive_message', message)
    const recipientId = match.user1_id === userId ? match.user2_id : match.user1_id
    notifyUser(recipientId, 'message', { matchId })

    res.status(201).json({ message: { ...message, isMine: true } })
  } catch (error) {
    console.error('Send media error:', error)
    res.status(500).json({ error: 'Failed to send' })
  }
}

// Previews are tiny JPEGs as data URLs; anything else is ignored
const MAX_PREVIEW_CHARS = 6000
const validPreview = (v) =>
  typeof v === 'string' && v.length <= MAX_PREVIEW_CHARS && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(v) ? v : null

// GET /api/messages/:matchId/media/:messageId
// The file for a photo, video or voice message, only for the two people in
// the chat. A view-once file is handed to the other person a single time and
// deleted straight after; the sender can't open it again either.
export const getMedia = async (req, res) => {
  try {
    const { matchId, messageId } = req.params
    const userId = req.user.id
    const notFound = () => res.status(404).json({ error: 'Not found' })

    if (!await findMyMatch(matchId, userId)) return notFound()

    const { data: message } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('match_id', matchId)
      .maybeSingle()
    if (!message) return notFound()

    const viewOnce = message.view_once === true
    if (viewOnce) {
      if (message.sender_id === userId) {
        return res.status(403).json({ error: 'View-once photos and videos only open for the other person', code: 'VIEW_ONCE' })
      }
      if (message.viewed_at || !message.media_path) {
        return res.status(410).json({ error: 'Already opened', code: 'VIEWED' })
      }
    }
    if (!message.media_path) return notFound()

    const buf = await downloadMedia(message.media_path)
    if (!buf) return notFound()

    if (viewOnce) {
      // Claim the one view. Two requests at once: only one gets the file.
      const viewedAt = new Date().toISOString()
      const { data: claimed } = await supabase
        .from('messages')
        .update({ viewed_at: viewedAt, media_path: null, ...('media_preview' in message ? { media_preview: null } : {}) })
        .eq('id', messageId)
        .is('viewed_at', null)
        .select('id')
      if (!Array.isArray(claimed) || claimed.length === 0) {
        return res.status(410).json({ error: 'Already opened', code: 'VIEWED' })
      }
      removeMedia([message.media_path])
      req.app.get('io')?.to(matchId).emit('message_viewed', { matchId, messageId, viewedAt })
    }

    res.set({
      'Content-Type': kindForType(message.media_type) ? message.media_type : 'application/octet-stream',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': viewOnce ? 'no-store' : 'private, max-age=300',
    })
    res.send(buf)
  } catch (error) {
    console.error('Get media error:', error)
    res.status(500).json({ error: 'Failed to load' })
  }
}
