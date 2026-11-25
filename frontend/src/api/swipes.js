import apiClient from './client.js'

export const swipesApi = {
  swipe: async (targetId, direction) => {
    return await apiClient.post('/api/swipes', { targetId, direction })
  },

  undo: async (targetId) => {
    return await apiClient.delete(`/api/swipes/${targetId}`)
  },

  getMySwipes: async () => {
    return await apiClient.get('/api/swipes/mine')
  }
}