import apiClient from './client.js'

export const notificationsApi = {
  registerDevice: (token) => apiClient.post('/api/notifications/devices', { token, platform: 'ios' }),
  unregisterDevice: (token) => apiClient.delete(`/api/notifications/devices/${token}`),
}
