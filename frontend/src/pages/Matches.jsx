import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Heart, X, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState, { emptyCtaClass } from '@/components/shared/EmptyState';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { swipesApi } from '@/api/swipes';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import { useLikes, useRefresh } from '@/api/queries';
import { lookingForLabel } from '@/lib/profileOptions';
import SafetyActions from '@/components/safety/SafetyActions';

export default function Matches() {
  const [previewProfile, setPreviewProfile] = useState(null);
  const navigate = useNavigate();
  const refresh = useRefresh();

  const { data: likesData = {}, isLoading } = useLikes({ refetchInterval: 15000 });

  const likes = likesData?.likes || [];

  const actionMutation = useMutation({
    mutationFn: async ({ userId, action }) => {
      if (action === 'like') {
        return await swipesApi.swipe(userId, 'right')
      } else if (action === 'pass') {
        return await swipesApi.swipe(userId, 'left')
      }
    },
    onSuccess: (result, { action }) => {
      refresh.matchesAndLikes()
      if (result?.matched) {
        navigate('/Messages')
      }
    },
  });


  return (
    <div className="p-4 space-y-4 pb-8">
      <div>
        <h2 className="text-3xl font-serif italic font-medium tracking-tight">Who wants you</h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70 mt-1.5">
          {isLoading ? '...' : `${likes.length} waiting`}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : likes.length > 0 ? (
        <div className="space-y-3">
          {likes.map(profile => (
            <div
              key={profile.id}
              className={`flex items-center gap-3 p-3 rounded-2xl bg-card border ${profile.superLiked ? 'border-gold/60' : 'border-border/50'}`}
            >
              <button
                onClick={() => setPreviewProfile(profile)}
                className="shrink-0"
              >
                <ProfileAvatar
                  photoUrl={profile.photos?.[0]?.url}
                  username={profile.username}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-accent/40"
                  textClassName="text-xl"
                />
              </button>

              <button
                className="flex-1 min-w-0 text-left"
                onClick={() => setPreviewProfile(profile)}
              >
                <p className="font-semibold text-sm truncate">{profile.username}</p>
                {profile.superLiked && (
                  <p className="text-[11px] text-gold flex items-center gap-1">
                    <Star className="w-3 h-3" fill="currentColor" /> Super Liked you
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {profile.age && `${profile.age} · `}{profile.city || profile.country}
                </p>
                {profile.bio && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{profile.bio}</p>
                )}
              </button>

              <div className="flex flex-col gap-1.5">
                <Button
                  size="sm"
                  className="w-9 h-9 rounded-full p-0 bg-gradient-to-br from-primary to-accent"
                  onClick={() => actionMutation.mutate({ userId: profile.id, action: 'like' })}
                  disabled={actionMutation.isPending}
                >
                  <Heart className="w-4 h-4 text-white" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-9 h-9 rounded-full p-0 border-red-400/50 hover:bg-red-400/10"
                  onClick={() => actionMutation.mutate({ userId: profile.id, action: 'pass' })}
                  disabled={actionMutation.isPending}
                >
                  <X className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          drawing="glass"
          title="Your admirers will gather here"
          className="py-14"
          action={<Link to="/Discover" className={emptyCtaClass}>Back to Discover</Link>}
        >
          Someone is about to notice you. Keep looking.
        </EmptyState>
      )}

      {previewProfile && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4"
          onClick={() => setPreviewProfile(null)}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-6 space-y-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <ProfileAvatar
                photoUrl={previewProfile.photos?.[0]?.url}
                username={previewProfile.username}
                className="w-20 h-20 rounded-2xl object-cover"
                textClassName="text-3xl"
              />
              <div>
                <h3 className="font-bold text-lg">{previewProfile.username}</h3>
                <p className="text-sm text-muted-foreground">
                  {previewProfile.age && `${previewProfile.age} · `}
                  {previewProfile.city || previewProfile.country}
                </p>
                {previewProfile.looking_for && (
                  <p className="text-xs text-gold mt-1">{lookingForLabel(previewProfile.looking_for) || previewProfile.looking_for}{previewProfile.is_couple ? ' · Couple' : ''}</p>
                )}
              </div>
            </div>

            {previewProfile.bio && (
              <p className="text-sm text-muted-foreground">{previewProfile.bio}</p>
            )}

            {previewProfile.interests?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {previewProfile.interests.slice(0, 6).map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-full bg-secondary">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-red-400/50 hover:bg-red-400/10 text-red-400"
                onClick={() => {
                  actionMutation.mutate({ userId: previewProfile.id, action: 'pass' })
                  setPreviewProfile(null)
                }}
              >
                <X className="w-4 h-4 mr-2" /> Pass
              </Button>
              <Button
                className="flex-1 bg-gradient-to-br from-primary to-accent text-white"
                onClick={() => {
                  actionMutation.mutate({ userId: previewProfile.id, action: 'like' })
                  setPreviewProfile(null)
                }}
              >
                <Heart className="w-4 h-4 mr-2" /> Like back
              </Button>
            </div>

            <SafetyActions
              userId={previewProfile.id}
              username={previewProfile.username}
              onBlocked={() => { setPreviewProfile(null); refresh.matchesAndLikes(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}