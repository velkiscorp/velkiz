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

  blockUser: async (matchId) => {
    return await apiClient.patch(`/api/matches/${matchId}/block`)
  }
}

