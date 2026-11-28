import apiClient from './client.js'

export const messagesApi = {
  getMessages: async (matchId) => {
    return await apiClient.get(`/api/messages/${matchId}`)
  },

  sendMessage: async (matchId, content, replyToId) => {
    return await apiClient.post(`/api/messages/${matchId}`, replyToId ? { content, replyToId } : { content })
  },

  // A photo, video or voice message. file: a Blob/File with its type set.
  sendMedia: async (matchId, file, { replyToId, duration } = {}) => {
    return await apiClient.post(`/api/messages/${matchId}/media`, file, {
      headers: { 'Content-Type': file.type },
      params: { replyToId, duration: duration ? Math.round(duration * 10) / 10 : undefined },
      timeout: 120000,
    })
  },

  // The file behind a photo, video or voice message, as a Blob
  getMedia: async (matchId, messageId) => {
    return await apiClient.get(`/api/messages/${matchId}/media/${messageId}`, { responseType: 'blob' })
  },

  // Unsend one of your messages: gone for both of you
  unsend: async (matchId, messageId) => {
    return await apiClient.delete(`/api/messages/${matchId}/${messageId}`)
  },

  // Delete the whole chat for both of you
  clearChat: async (matchId) => {
    return await apiClient.delete(`/api/messages/${matchId}`)
  },

  // iPhone app only: someone screenshotted this chat
  reportScreenshot: async (matchId) => {
    return await apiClient.post(`/api/messages/${matchId}/screenshot`)
  }
}