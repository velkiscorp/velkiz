import { supabase } from '../config/supabase.js'
import { containsPhoneNumber } from '../utils/phone.js'


// GET ALL MESSAGES IN A MATCH
export const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params
    const userId = req.user.id

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
      return res.status(403).json({ error: 'This match no longer exists' })
    }

    // Get all messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, content, sender_id, is_filtered, read_at, created_at')
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

    res.json({ messages: enriched })

  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
}

// SEND A MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const { matchId } = req.params
    const { content } = req.body
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



    // Save to database
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
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