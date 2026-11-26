import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { MessageCircle } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';

export default function MatchModal({ match, myProfile, onChat, onClose }) {
  if (!match) return null;

  const theirUsername = match.matchedWith?.username;
  const theirPhoto = match.matchedWith?.photos?.[0]?.url;
  const myUsername = myProfile?.username;
  const myPhoto = myProfile?.photos?.[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 overflow-hidden"
    >
      {/* Two red curtains that part to reveal the match */}
      <motion.div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-accent to-primary/80 pointer-events-none"
        initial={{ x: 0 }}
        animate={{ x: '-100%' }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: 0.1 }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-accent to-primary/80 pointer-events-none"
        initial={{ x: 0 }}
        animate={{ x: '100%' }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: 0.1 }}
      />
      {/* Low red light left behind */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 45%, hsl(346 75% 32% / 0.55), transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="w-full max-w-sm text-center space-y-8 relative"
      >
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold/80">It's mutual</p>
          <motion.h2
            initial={{ opacity: 0, letterSpacing: '0.12em' }}
            animate={{ opacity: 1, letterSpacing: '0em' }}
            transition={{ delay: 0.75, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl font-serif italic font-medium leading-tight text-silk"
          >
            You want each other
          </motion.h2>
        </div>

        {/* Two portraits leaning in */}
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ x: -80, opacity: 0, rotate: -14 }}
            animate={{ x: 0, opacity: 1, rotate: -5 }}
            transition={{ delay: 0.9, type: 'spring', stiffness: 120, damping: 16 }}
            className="w-28 h-36 rounded-sm border border-gold/70 shadow-[0_0_40px_hsl(346_75%_36%/0.6)] -mr-3 z-10 overflow-hidden"
          >
            <ProfileAvatar
              photoUrl={myPhoto}
              username={myUsername}
              className="w-full h-full object-cover"
              textClassName="text-3xl"
            />
          </motion.div>
          <motion.div
            initial={{ x: 80, opacity: 0, rotate: 14 }}
            animate={{ x: 0, opacity: 1, rotate: 5 }}
            transition={{ delay: 0.9, type: 'spring', stiffness: 120, damping: 16 }}
            className="w-28 h-36 rounded-sm border border-gold/70 shadow-[0_0_40px_hsl(346_75%_36%/0.6)] -ml-3 overflow-hidden"
          >
            <ProfileAvatar
              photoUrl={theirPhoto}
              username={theirUsername}
              className="w-full h-full object-cover"
              textClassName="text-3xl"
            />
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-muted-foreground text-sm"
        >
          <span className="text-foreground font-medium">{theirUsername || 'They'}</span> feels the same way
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.45 }}
          className="flex flex-col gap-3"
        >
          <Button onClick={onChat} className="h-12 bg-gradient-to-b from-primary to-accent text-primary-foreground text-xs uppercase tracking-[0.25em] font-medium shadow-[0_0_40px_hsl(346_75%_36%/0.5)]">
            <MessageCircle className="w-4 h-4 mr-2" />
            Make the first move
          </Button>
          <Button variant="ghost" onClick={onClose} className="h-10 text-muted-foreground hover:text-foreground hover:bg-transparent text-xs uppercase tracking-[0.2em]">
            Keep looking
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
