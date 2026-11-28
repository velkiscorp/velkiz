import apiClient from './client.js'

export const swipesApi = {
  // message: optional note, only with a Super Like
  swipe: async (targetId, direction, message) => {
    return await apiClient.post('/api/swipes', message ? { targetId, direction, message } : { targetId, direction })
  },

  undo: async (targetId) => {
    return await apiClient.delete(`/api/swipes/${targetId}`)
  },

  getMySwipes: async () => {
    return await apiClient.get('/api/swipes/mine')
  }
}