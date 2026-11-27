import React from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';

// Full-screen "X is calling" with answer and decline
export default function IncomingCall({ partner, video, onAccept, onDecline }) {
  const name = partner?.username || 'A match';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-between bg-background/95 backdrop-blur-xl pt-safe pb-safe"
      role="dialog"
      aria-label={`Incoming call from ${name}`}
    >
      <div className="flex flex-col items-center gap-4 mt-24 px-6 text-center">
        <div className="relative">
          <span className="absolute inset-0 rounded-full ring-2 ring-gold/50 animate-ping" />
          <ProfileAvatar
            photoUrl={partner?.photoUrl}
            username={partner?.username}
            className="relative w-32 h-32 rounded-full object-cover ring-2 ring-gold/70"
            textClassName="text-4xl"
          />
        </div>
        <h2 className="font-serif italic text-3xl text-gold">{name}</h2>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {video ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          Velkiz {video ? 'video' : 'voice'} call
        </p>
      </div>

      <div className="flex items-center justify-center gap-20 mb-16">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onDecline}
            aria-label="Decline"
            className="w-16 h-16 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
          <span className="text-xs text-muted-foreground">Decline</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onAccept}
            aria-label="Answer"
            className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            {video ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
          </button>
          <span className="text-xs text-muted-foreground">Answer</span>
        </div>
      </div>
    </motion.div>
  );
}
