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

  blockUser: async (matchId) => {
    return await apiClient.patch(`/api/matches/${matchId}/block`)
  }
}

