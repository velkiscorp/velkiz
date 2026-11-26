import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/AuthContext'
import { profilesApi } from './profiles'
import { matchesApi } from './matches'
import { messagesApi } from './messages'
import { superLikesApi } from './superLikes'

// The ONE place the app's shared data is loaded and cached.
// Every page that needs your profile, your matches or your likes uses these
// hooks, so they all share the same cache: saving your profile, a new match
// or a new message updates every screen at once instead of only the one
// that happened to use the right cache key.

export const queryKeys = {
  myProfile: (userId) => ['myProfile', userId],
  matches: (userId) => ['matches', userId],
  likes: (userId) => ['likes', userId],
  chatMessages: (matchId) => ['chatMessages', matchId],
  superLikes: (userId) => ['superLikes', userId],
}

export const useMyProfile = () => {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.myProfile(user?.id),
    queryFn: () => profilesApi.getMyProfile(),
    enabled: !!user?.id,
  })
}

// refetchInterval: how often this screen wants fresh data (ms). When several
// screens are open, the fastest one wins.
export const useMatches = ({ refetchInterval } = {}) => {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.matches(user?.id),
    queryFn: () => matchesApi.getMyMatches(),
    enabled: !!user?.id,
    refetchInterval,
  })
}

export const useLikes = ({ refetchInterval } = {}) => {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.likes(user?.id),
    queryFn: () => matchesApi.getLikesReceived(),
    enabled: !!user?.id,
    refetchInterval,
  })
}

export const useChatMessages = (matchId, { refetchInterval } = {}) => {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.chatMessages(matchId),
    queryFn: () => messagesApi.getMessages(matchId),
    enabled: !!matchId && !!user?.id,
    refetchInterval,
  })
}

// How many Super Likes I have: { freeAvailable, nextFreeAt, purchased, total }
export const useSuperLikes = () => {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.superLikes(user?.id),
    queryFn: () => superLikesApi.get(),
    enabled: !!user?.id,
    // The free one comes back on its own after 24 hours
    refetchInterval: 5 * 60 * 1000,
  })
}

// "This changed, reload it everywhere"
export const useRefresh = () => {
  const queryClient = useQueryClient()
  const refresh = (key) => queryClient.invalidateQueries({ queryKey: [key] })
  return {
    myProfile: () => refresh('myProfile'),
    matches: () => refresh('matches'),
    likes: () => refresh('likes'),
    superLikes: () => refresh('superLikes'),
    chatMessages: (matchId) => queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(matchId) }),
    // A match or unmatch changes both lists
    matchesAndLikes: () => { refresh('matches'); refresh('likes') },
  }
}
