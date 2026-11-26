import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { MapPin, Sparkles, Eye, EyeOff, Info } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SecureImage from '@/components/shared/SecureImage';
import { lookingForLabel } from '@/lib/profileOptions';
import { useUnits } from '@/lib/units';

export default function SwipeCard({ profile, onSwipe, isTop, swipeDir, onTapInfo }) {
  const units = useUnits();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [revealedNSFW, setRevealedNSFW] = useState({});

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -30], [1, 0]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 120) onSwipe('right');
    else if (info.offset.x < -120) onSwipe('left');
  };

  // Normalize photos array - empty (not a stock-photo placeholder) when there's genuinely none
  const photos = profile.photos?.length > 0
    ? profile.photos
    : (profile.photo_url ? [{ url: profile.photo_url, is_nsfw: false }] : []);

  const currentPhoto = photos[photoIdx];
  const isRevealed = revealedNSFW[photoIdx];

  const prevPhoto = (e) => { e.stopPropagation(); setPhotoIdx(i => Math.max(0, i - 1)); };
  const nextPhoto = (e) => { e.stopPropagation(); setPhotoIdx(i => Math.min(photos.length - 1, i + 1)); };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.03 }}
      animate={
        swipeDir === 'right' ? { x: 500, rotate: 14, opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }
        : swipeDir === 'left' ? { x: -500, rotate: -14, opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }
        : swipeDir === 'super' ? { y: -500, scale: 1.05, opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }
        : swipeDir === 'skip' ? { scale: 0.85, opacity: 0, transition: { duration: 0.25 } }
        : {}
      }
    >
      <div className={`w-full h-full rounded-md overflow-hidden relative bg-card border border-gold/15 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] ${isTop ? 'silk-sheen' : ''}`}>

        {/* Photo */}
        <div className="absolute inset-0">
          {currentPhoto?.url ? (
            <SecureImage
              src={currentPhoto.url}
              alt={profile.username}
              className="w-full h-full object-cover"
              style={currentPhoto?.is_nsfw && !isRevealed ? { filter: 'blur(20px)', transform: 'scale(1.1)' } : {}}
            />
          ) : (
            <ProfileAvatar
              photoUrl={null}
              username={profile.username}
              className="w-full h-full object-cover"
              textClassName="text-8xl"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
          {/* Faint oxblood tint so every photo sits in the same low light */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/25 mix-blend-multiply" />
        </div>

        {/* NSFW blur overlay */}
        {currentPhoto?.is_nsfw && !isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button
              onClick={(e) => { e.stopPropagation(); setRevealedNSFW(r => ({ ...r, [photoIdx]: true })); }}
              className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-black/60 backdrop-blur-sm border border-white/20"
            >
              <EyeOff className="w-7 h-7 text-white/70" />
              <span className="text-white font-semibold text-sm">NSFW — Tap to reveal</span>
            </button>
          </div>
        )}

        {/* Photo dot indicators */}
        {photos.length > 1 && (
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 z-20">
            {photos.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-200 ${
                  i === photoIdx ? 'w-6 bg-gold' : 'w-3 bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Photo navigation tap zones */}
        {photos.length > 1 && (
          <>
            <button
              className="absolute left-0 top-0 bottom-1/3 w-1/3 z-10"
              onClick={prevPhoto}
            />
            <button
              className="absolute right-0 top-0 bottom-1/3 w-1/3 z-10"
              onClick={nextPhoto}
            />
          </>
        )}

        {/* NSFW revealed badge */}
        {currentPhoto?.is_nsfw && isRevealed && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/80 backdrop-blur-sm">
            <Eye className="w-3 h-3 text-white" />
            <span className="text-white text-xs font-semibold">NSFW</span>
          </div>
        )}

        {/* Like / Nope / Super overlays */}
        <motion.div
          className="absolute top-10 right-6 border border-gold px-4 py-1.5 rotate-[10deg] z-20 bg-black/30 backdrop-blur-sm"
          style={{ opacity: likeOpacity }}
        >
          <span className="text-gold text-3xl font-serif italic">Wanted</span>
        </motion.div>
        <motion.div
          className="absolute top-10 left-6 border border-white/60 px-4 py-1.5 -rotate-[10deg] z-20 bg-black/30 backdrop-blur-sm"
          style={{ opacity: nopeOpacity }}
        >
          <span className="text-white/80 text-3xl font-serif italic">Not tonight</span>
        </motion.div>

        {/* Profile Info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2.5 z-10">
          <div>
            <h3 className="text-3xl font-serif italic font-medium text-white leading-tight">
              {profile.username}{profile.age ? `, ${profile.age}` : ''}
            </h3>
            {(profile.is_couple || profile.height_cm) && (
              <div className="flex items-center gap-2 mt-1">
                {profile.is_couple && (
                  <Badge className="rounded-sm bg-gold/90 text-black border-transparent text-[10px] font-semibold uppercase tracking-[0.12em] px-2 hover:bg-gold/90">Couple</Badge>
                )}
                {profile.height_cm && (
                  <span className="text-white/60 text-xs">{units.height(profile.height_cm)}</span>
                )}
              </div>
            )}
            {(profile.city || profile.country) && (
              <div className="flex items-center gap-1 text-white/60 text-xs uppercase tracking-[0.15em] mt-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {[profile.city, profile.country].filter(Boolean).join(', ')}
                {profile.distance_km != null && <span className="normal-case tracking-normal"> · {units.distance(profile.distance_km)} away</span>}
              </div>
            )}
          </div>
          {profile.bio && (
            <p className="text-white/80 text-sm font-light line-clamp-2">{profile.bio}</p>
          )}
          {profile.interests?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.slice(0, 4).map(tag => (
                <Badge key={tag} className="rounded-sm bg-black/20 backdrop-blur-sm text-gold border border-gold/40 text-[10px] font-medium uppercase tracking-[0.12em] px-2">
                  {tag}
                </Badge>
              ))}
              {profile.interests.length > 4 && (
                <Badge className="rounded-sm bg-black/20 backdrop-blur-sm text-gold border border-gold/40 text-[10px] font-medium px-2">
                  +{profile.interests.length - 4}
                </Badge>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            {profile.looking_for && (
              <div className="flex items-center gap-1.5 text-gold/90 text-xs font-medium tracking-wide">
                <Sparkles className="w-3 h-3" />
                Looking for {(lookingForLabel(profile.looking_for) || profile.looking_for).toLowerCase()}
              </div>
            )}
            {onTapInfo && (
              <button
                onClick={(e) => { e.stopPropagation(); onTapInfo(); }}
                className="ml-auto w-8 h-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors"
              >
                <Info className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}