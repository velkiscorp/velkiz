import apiClient from './client.js'

export const callsApi = {
  // { enabled } - false until LiveKit is set up on the server
  config: () => apiClient.get('/api/calls/config'),
  // Ring the other person in this match. Returns { call, url, token }
  start: (matchId, video) => apiClient.post(`/api/calls/match/${matchId}`, { video: !!video }),
  accept: (callId) => apiClient.post(`/api/calls/${callId}/accept`),
  decline: (callId) => apiClient.post(`/api/calls/${callId}/decline`),
  end: (callId) => apiClient.post(`/api/calls/${callId}/end`),
}
