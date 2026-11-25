import apiClient from './client.js'

export const messagesApi = {
  getMessages: async (matchId) => {
    return await apiClient.get(`/api/messages/${matchId}`)
  },

  sendMessage: async (matchId, content) => {
    return await apiClient.post(`/api/messages/${matchId}`, { content })
  }
}