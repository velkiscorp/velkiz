import apiClient from './client.js'

export const messagesApi = {
  getMessages: async (matchId) => {
    return await apiClient.get(`/api/messages/${matchId}`)
  },

  sendMessage: async (matchId, content, replyToId) => {
    return await apiClient.post(`/api/messages/${matchId}`, replyToId ? { content, replyToId } : { content })
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