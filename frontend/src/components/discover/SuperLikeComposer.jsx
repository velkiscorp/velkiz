import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfileAvatar from '@/components/shared/ProfileAvatar';

const MAX = 200;

// Before a Super Like goes out: add an optional note. They see it with the
// Super Like, and it becomes the first message if they like you back.
export default function SuperLikeComposer({ profile, remaining, onSend, onClose }) {
  const [text, setText] = useState('');
  const send = (withText) => onSend(withText ? text.trim() || null : null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-card border-t border-gold/40 rounded-t-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] space-y-4"
      >
        <div className="flex items-center gap-3">
          <ProfileAvatar
            photoUrl={profile.photos?.[0]?.url}
            username={profile.username}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-gold/70"
            textClassName="text-lg"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-serif italic text-xl text-gold truncate">Super Like {profile.username}</h3>
            <p className="text-xs text-muted-foreground">
              You'll be at the top of their Discover. {remaining != null && `${remaining} left.`}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder="Say something they'll remember (optional)"
            rows={3}
            className="w-full resize-none rounded-xl bg-black/30 border border-border px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
          <p className="text-[11px] text-muted-foreground text-right">{text.length}/{MAX}</p>
        </div>

        <Button
          onClick={() => send(true)}
          className="w-full h-12 rounded-full bg-gradient-to-b from-gold to-[hsl(37_40%_60%)] text-primary font-semibold hover:brightness-110 [&_svg]:size-5"
        >
          <Star fill="currentColor" />
          {text.trim() ? 'Send Super Like with note' : 'Send Super Like'}
        </Button>
      </motion.div>
    </motion.div>
  );
}
