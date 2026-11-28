import apiClient from './client.js'

export const matchesApi = {
  getMyMatches: async () => {
    return await apiClient.get('/api/matches')
  },

  getLikesReceived: async () => {
    return await apiClient.get('/api/matches/likes')
  },

  unmatch: async (matchId) => {
    return await apiClient.patch(`/api/matches/${matchId}/unmatch`)
  },

  // "Keep chat": once both tap it, the chat never disappears
  keepChat: async (matchId) => {
    return await apiClient.post(`/api/matches/${matchId}/keep`)
  },

  // Take back the keep invite you sent
  cancelKeep: async (matchId) => {
    return await apiClient.delete(`/api/matches/${matchId}/keep`)
  },

  // "Not now" on their keep invite
  declineKeep: async (matchId) => {
    return await apiClient.post(`/api/matches/${matchId}/keep/decline`)
  },

  blockUser: async (matchId) => {
    return await apiClient.patch(`/api/matches/${matchId}/block`)
  }
}

