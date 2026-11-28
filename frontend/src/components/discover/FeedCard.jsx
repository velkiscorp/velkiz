import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Info, MapPin, Sparkles, EyeOff, ChevronRight, X } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SecureImage from '@/components/shared/SecureImage';
import { lookingForLabel } from '@/lib/profileOptions';
import { useUnits } from '@/lib/units';

// One person in the Discover feed. Fills the screen; swipe sideways through
// their photos and then their details. Double-tap a photo to like.
// decision: 'right' | 'super' | 'left' | undefined
export default function FeedCard({ profile, decision, superLeft, busy, onLike, onSuper, onInfo }) {
  const units = useUnits();
  const pager = useRef(null);
  const [slide, setSlide] = useState(0);
  const [revealed, setRevealed] = useState({});
  const [heartPop, setHeartPop] = useState(0);
  const lastTap = useRef(0);

  const photos = profile.photos?.length > 0
    ? profile.photos
    : (profile.photo_url ? [{ url: profile.photo_url, is_nsfw: false }] : [{ url: null }]);
  const slides = photos.length + 1; // the last slide is their details

  const onPagerScroll = () => {
    const el = pager.current;
    if (el) setSlide(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i) => {
    const el = pager.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  const liked = decision === 'right' || decision === 'super';

  const tapPhoto = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      setHeartPop(n => n + 1);
      if (!liked) onLike();
    } else {
      lastTap.current = now;
    }
  };

  const where = [profile.city, profile.country].filter(Boolean).join(', ');

  return (
    <div className="relative w-full h-full overflow-hidden rounded-md bg-card border border-gold/15">
      {/* Photos, then details: swipe sideways */}
      <div
        ref={pager}
        onScroll={onPagerScroll}
        className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        style={{ touchAction: 'pan-x pan-y' }}
      >
        {photos.map((photo, i) => {
          const hidden = photo.is_nsfw && !revealed[i];
          return (
            <div key={i} className="relative w-full h-full shrink-0 snap-center" onClick={tapPhoto}>
              {photo.url ? (
                <SecureImage
                  src={photo.url}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                  style={hidden ? { filter: 'blur(24px)', transform: 'scale(1.1)' } : undefined}
                />
              ) : (
                <ProfileAvatar photoUrl={null} username={profile.username} className="w-full h-full" textClassName="text-8xl" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30 pointer-events-none" />
              {hidden && (
                <button
                  onClick={(e) => { e.stopPropagation(); setRevealed(r => ({ ...r, [i]: true })); }}
                  className="absolute inset-0 m-auto w-fit h-fit flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-black/60 backdrop-blur-sm border border-white/20"
                >
                  <EyeOff className="w-7 h-7 text-white/70" />
                  <span className="text-white font-semibold text-sm">NSFW, tap to reveal</span>
                </button>
              )}
            </div>
          );
        })}

        {/* Details */}
        <div className="relative w-full h-full shrink-0 snap-center overflow-y-auto bg-gradient-to-b from-[hsl(346_40%_10%)] to-background px-5 pt-14 pb-28 space-y-5">
          <div>
            <h3 className="text-3xl font-serif italic text-gold leading-tight">
              {profile.username}{profile.age ? `, ${profile.age}` : ''}
            </h3>
            {where && (
              <p className="flex items-center gap-1 text-white/60 text-xs uppercase tracking-[0.15em] mt-1.5">
                <MapPin className="w-3.5 h-3.5" />{where}
                {profile.distance_km != null && <span className="normal-case tracking-normal"> · {units.distance(profile.distance_km)} away</span>}
              </p>
            )}
          </div>
          {profile.bio && <p className="text-[15px] leading-relaxed text-white/85 whitespace-pre-line">{profile.bio}</p>}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {profile.looking_for && <Detail label="Looking for" value={lookingForLabel(profile.looking_for) || profile.looking_for} />}
            {profile.height_cm && <Detail label="Height" value={units.height(profile.height_cm)} />}
            {profile.is_couple && <Detail label="Profile" value="Couple" />}
          </dl>
          {profile.interests?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map(tag => (
                <span key={tag} className="rounded-sm text-gold border border-gold/40 text-[11px] uppercase tracking-[0.12em] px-2 py-0.5">{tag}</span>
              ))}
            </div>
          )}
          <button onClick={onInfo} className="text-xs text-muted-foreground underline underline-offset-4">See full profile</button>
        </div>
      </div>

      {/* Slide dots */}
      {slides > 1 && (
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
          {Array.from({ length: slides }, (_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i === slide ? 'w-6 bg-gold' : 'w-3 bg-white/35'}`} />
          ))}
        </div>
      )}

      {/* Super Liked you */}
      {profile.superLikedYou && (
        <div className="absolute top-7 left-3 right-16 z-10 space-y-1.5 pointer-events-none">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-b from-gold to-[hsl(37_40%_60%)] text-primary text-xs font-semibold px-2.5 py-1 shadow-[0_0_16px_hsl(37_60%_60%/0.6)]">
            <Star className="w-3.5 h-3.5" fill="currentColor" /> Super Liked you
          </span>
          {profile.superLikeMessage && (
            <p className="w-fit max-w-full rounded-2xl rounded-tl-sm bg-black/60 backdrop-blur-sm border border-gold/40 px-3 py-2 text-sm text-white">
              “{profile.superLikeMessage}”
            </p>
          )}
        </div>
      )}

      {/* Name and a hint, on the photos */}
      {slide < photos.length && (
        <div className="absolute bottom-0 left-0 right-16 p-5 z-10 pointer-events-none space-y-1.5">
          <h3 className="text-3xl font-serif italic text-white leading-tight drop-shadow">
            {profile.username}{profile.age ? `, ${profile.age}` : ''}
          </h3>
          {where && (
            <p className="flex items-center gap-1 text-white/70 text-xs uppercase tracking-[0.15em]">
              <MapPin className="w-3.5 h-3.5" />{profile.city || profile.country}
              {profile.distance_km != null && <span className="normal-case tracking-normal"> · {units.distance(profile.distance_km)}</span>}
            </p>
          )}
          {profile.looking_for && (
            <p className="flex items-center gap-1.5 text-gold/90 text-xs">
              <Sparkles className="w-3 h-3" />
              Looking for {(lookingForLabel(profile.looking_for) || profile.looking_for).toLowerCase()}
            </p>
          )}
          {profile.bio && <p className="text-white/80 text-sm line-clamp-2">{profile.bio}</p>}
          <button
            onClick={() => goTo(photos.length)}
            className="pointer-events-auto flex items-center gap-0.5 text-[11px] text-white/60 uppercase tracking-[0.15em]"
          >
            Swipe for more <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="absolute right-3 bottom-6 z-20 flex flex-col items-center gap-4">
        <RailButton label={liked ? 'Liked' : 'Like'} onClick={liked ? undefined : onLike} disabled={busy || liked}>
          <Heart className={`w-8 h-8 ${liked ? 'text-primary' : 'text-white'}`} fill={liked ? 'currentColor' : 'none'} strokeWidth={liked ? 0 : 2} />
        </RailButton>
        <RailButton label={decision === 'super' ? 'Sent' : 'Super'} onClick={decision === 'super' ? undefined : onSuper} disabled={busy || decision === 'super'} badge={superLeft}>
          <Star className="w-8 h-8 text-gold" fill={decision === 'super' ? 'currentColor' : 'none'} strokeWidth={decision === 'super' ? 0 : 2} />
        </RailButton>
        <RailButton label="Profile" onClick={onInfo}>
          <Info className="w-7 h-7 text-white" />
        </RailButton>
      </div>

      {decision === 'left' && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white/70">
          <X className="w-3 h-3" /> Passed. Tap the heart to like anyway
        </div>
      )}

      {/* Double-tap heart */}
      <AnimatePresence>
        {heartPop > 0 && (
          <motion.div
            key={heartPop}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none text-primary"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1.2, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, times: [0, 0.35, 1] }}
            onAnimationComplete={() => setHeartPop(0)}
          >
            <Heart className="w-28 h-28 drop-shadow-[0_0_24px_hsl(346_75%_36%/0.8)]" fill="currentColor" strokeWidth={0} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</dt>
      <dd className="text-white/90">{value}</dd>
    </div>
  );
}

function RailButton({ label, onClick, disabled, badge, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled && !!onClick}
      aria-label={label}
      className="relative flex flex-col items-center gap-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] active:scale-90 transition-transform"
    >
      {children}
      {badge != null && (
        <span className="absolute -top-1 -right-2 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold ring-2 ring-black/40 flex items-center justify-center">{badge}</span>
      )}
      <span className="text-[10px] text-white/85 font-medium">{label}</span>
    </button>
  );
}
