import apiClient from './client.js'

export const superLikesApi = {
  // { freeAvailable, nextFreeAt, purchased, total }
  get: () => apiClient.get('/api/super-likes'),
}
