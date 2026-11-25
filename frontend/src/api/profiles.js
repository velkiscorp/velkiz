import apiClient from './client.js'

export const profilesApi = {
  // filters: the query from lib/discoverFilters.js toQueryParams()
  getProfiles: async ({ filters = {}, limit, offset } = {}) => {
    return await apiClient.get('/api/profiles', {
      params: { ...filters, limit, offset }
    })
  },

  getMyProfile: async () => {
    return await apiClient.get('/api/profiles/me')
  },

  updateMyProfile: async (data) => {
    return await apiClient.put('/api/profiles/me', data)
  },

  getProfileById: async (id) => {
    return await apiClient.get(`/api/profiles/${id}`)
  }
}
