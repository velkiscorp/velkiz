import { supabase } from '@/lib/supabase'

// Uploads go into a folder named after you (the storage policy only allows
// that), so the backend can tell whose photo it is. The returned URL is only
// the photo's name: the bucket is private and the app shows photos through
// /api/photos instead (see lib/securePhoto.js).
export const uploadPhoto = async (file) => {
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) throw new Error('Please sign in again')

  const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  const { error } = await supabase.storage
    .from('photos')
    .upload(filePath, file, { contentType: file.type || undefined })

  if (error) throw error

  const { data } = supabase.storage
    .from('photos')
    .getPublicUrl(filePath)

  return data.publicUrl
}
