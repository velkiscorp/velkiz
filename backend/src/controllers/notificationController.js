import { supabase } from '../config/supabase.js'

// POST /api/notifications/devices { token, platform }
// Saves this phone for push. A token that moved to a new account is moved too.
export const registerDevice = async (req, res) => {
  try {
    const { token, platform } = req.body
    const { error } = await supabase
      .from('device_tokens')
      .upsert(
        { user_id: req.user.id, token, platform, updated_at: new Date().toISOString() },
        { onConflict: 'token' }
      )
    if (error) throw error
    res.json({ message: 'Device registered' })
  } catch (error) {
    console.error('Register device error:', error)
    res.status(500).json({ error: 'Failed to turn on notifications' })
  }
}

// DELETE /api/notifications/devices/:token (on sign out)
export const unregisterDevice = async (req, res) => {
  try {
    const { error } = await supabase
      .from('device_tokens')
      .delete()
      .eq('user_id', req.user.id)
      .eq('token', req.params.token)
    if (error) throw error
    res.json({ message: 'Device removed' })
  } catch (error) {
    console.error('Unregister device error:', error)
    res.status(500).json({ error: 'Failed to remove device' })
  }
}
