import apiClient from './client.js'

export const REPORT_REASONS = [
  { value: 'fake_profile', label: 'Fake profile or catfish' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate_photos', label: 'Inappropriate photos' },
  { value: 'underage', label: 'Looks under 18' },
  { value: 'spam_or_scam', label: 'Spam, scam or selling' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'threats_or_violence', label: 'Threats or violence' },
  { value: 'other', label: 'Something else' },
]

export const safetyApi = {
  block: (userId) => apiClient.post('/api/safety/block', { userId }),
  unblock: (userId) => apiClient.delete(`/api/safety/block/${userId}`),
  listBlocked: () => apiClient.get('/api/safety/blocks'),
  report: ({ userId, reason, details, matchId, alsoBlock }) =>
    apiClient.post('/api/safety/report', { userId, reason, details: details || null, matchId, alsoBlock }),
}
