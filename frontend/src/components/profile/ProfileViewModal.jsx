import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Flame, Heart, Star, Shield } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import PhotoViewer from '@/components/shared/PhotoViewer';
import SecureImage from '@/components/shared/SecureImage';
import SafetyActions from '@/components/safety/SafetyActions';
import { lookingForLabel, formatHeight } from '@/lib/profileOptions';

// onBlocked: shows Report and Block at the bottom, and runs once they're blocked
export default function ProfileViewModal({ profile, onClose, onLike, onSuper, onBlocked, matchId }) {
  const [viewerIndex, setViewerIndex] = useState(null);
  if (!profile) return null;

  // All photos (the backend only sends them once you've matched).
  // Accept both {url, is_nsfw} objects and plain URL strings.
  const photos = (profile.photos || [])
    .map(p => (typeof p === 'string' ? { url: p, is_nsfw: false } : p))
    .filter(p => p?.url);
  const mainPhoto = photos[0]?.url || profile.photo_url;

  const lookingForColors = {
    long_term: 'bg-primary/20 text-gold border-gold/30',
    short_term: 'bg-accent/20 text-accent border-accent/30',
    casual: 'bg-accent/20 text-accent border-accent/30',
    online: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    friends: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    open: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Sheet */}
        <motion.div
          className="relative w-full max-w-lg bg-background rounded-t-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          {/* Hero photo */}
          <div
            className={`relative h-72 shrink-0 ${photos.length ? 'cursor-pointer' : ''}`}
            onClick={() => photos.length && setViewerIndex(0)}
          >
            <ProfileAvatar
              photoUrl={mainPhoto}
              username={profile.username}
              className="w-full h-full object-cover"
              textClassName="text-8xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Name overlay */}
            <div className="absolute bottom-4 left-5 right-5">
              <h2 className="text-2xl font-bold text-white drop-shadow">
                {profile.username}{profile.age ? `, ${profile.age}` : ''}
              </h2>
              {(profile.city || profile.country) && (
                <div className="flex items-center gap-1 text-white/70 text-sm mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {[profile.city, profile.country].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Tags row */}
            <div className="flex flex-wrap gap-2">
              {profile.gender && (
                <Badge className="bg-primary/10 text-gold border-gold/20 capitalize">
                  {profile.gender.replace('_', ' ')}
                </Badge>
              )}
              {profile.orientation && (
                <Badge className="bg-accent/10 text-accent border-accent/20 capitalize">
                  {profile.orientation.replace('_', ' ')}
                </Badge>
              )}
              {profile.looking_for && (
                <Badge className={`border capitalize flex items-center gap-1 ${lookingForColors[profile.looking_for] || ''}`}>
                  <Flame className="w-3 h-3" />
                  {lookingForLabel(profile.looking_for) || profile.looking_for}
                </Badge>
              )}
              {profile.is_couple && (
                <Badge className="bg-gold/90 text-black border-transparent">Couple</Badge>
              )}
              {profile.height_cm && (
                <Badge className="bg-secondary text-muted-foreground border-border">{formatHeight(profile.height_cm)}</Badge>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Prompts */}
            {[
              { key: 'prompt1', label: 'My typical Sunday' },
              { key: 'prompt2', label: 'Biggest turn-on' },
              { key: 'prompt3', label: 'Perfect night' },
            ].map(({ key, label }) => profile[key] ? (
              <div key={key} className="p-3 rounded-xl bg-secondary/60 border border-border/40">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                <p className="text-sm text-foreground">{profile[key]}</p>
              </div>
            ) : null)}

            {/* Interests */}
            {profile.interests?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border/40">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* All photos - tap to open full screen */}
            {photos.length > 1 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setViewerIndex(i)}
                      className="relative aspect-square rounded-xl overflow-hidden bg-secondary"
                    >
                      <SecureImage
                        src={photo.url}
                        alt=""
                        className="w-full h-full object-cover"
                        style={photo.is_nsfw ? { filter: 'blur(16px)' } : undefined}
                      />
                      {photo.is_nsfw && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white/90">NSFW</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy note */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60 py-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Anonymous profile — real identity protected</span>
            </div>

            {onBlocked && (
              <SafetyActions
                userId={profile.id}
                username={profile.username}
                matchId={matchId}
                onBlocked={onBlocked}
              />
            )}
          </div>

          {/* Action buttons */}
          {(onLike || onSuper) && (
            <div className="p-4 border-t border-border/50 flex gap-3 shrink-0">
              {onSuper && (
                <Button
                  variant="outline"
                  className="flex-1 h-12 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
                  onClick={onSuper}
                >
                  <Star className="w-4 h-4 mr-2" fill="currentColor" />
                  Super Like
                </Button>
              )}
              {onLike && (
                <Button
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-accent text-white font-semibold"
                  onClick={onLike}
                >
                  <Heart className="w-4 h-4 mr-2" fill="white" />
                  Like
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
      {viewerIndex !== null && (
        <PhotoViewer photos={photos} startIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </AnimatePresence>
  );
}