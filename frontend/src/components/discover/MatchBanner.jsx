import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';

export default function MatchBanner({ match, onDismiss, onChat }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!match) return null;

  const theirUsername = match.matchedWith?.username;
  const theirPhoto = match.matchedWith?.photos?.[0]?.url;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      className="fixed top-3 left-3 right-3 z-50 max-w-lg mx-auto"
    >
      <button
        onClick={onChat}
        className="w-full flex items-center gap-3 p-3 rounded-md bg-card/95 backdrop-blur border border-gold/40 shadow-[0_10px_40px_hsl(346_75%_20%/0.6)] text-left"
      >
        <ProfileAvatar
          photoUrl={theirPhoto}
          username={theirUsername}
          className="w-10 h-12 rounded-sm object-cover shrink-0 border border-gold/40"
          textClassName="text-base"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-gold shrink-0" fill="currentColor" />
            You and {theirUsername || 'someone'} want each other
          </p>
          <p className="text-xs text-muted-foreground">Tap to make the first move</p>
        </div>
      </button>
    </motion.div>
  );
}