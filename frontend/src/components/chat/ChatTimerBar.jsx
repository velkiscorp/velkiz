import React, { useState } from 'react';
import { Hourglass, Infinity as InfinityIcon, Check } from 'lucide-react';
import { useNow, timeLeft, hoursLeft } from '@/lib/chatTimer';

// Under the chat header: how long until this chat disappears, and the
// "Keep chat" button. Nothing shows until you've both opened the chat.
export default function ChatTimerBar({ timer, onKeep }) {
  const now = useNow(15_000);
  const [sending, setSending] = useState(false);
  if (!timer || !timer.started) return null;

  if (timer.kept) {
    return (
      <div className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-[11px] text-gold/80 bg-gold/5 border-b border-gold/15">
        <InfinityIcon className="w-3.5 h-3.5" /> You both kept this chat. It won't disappear.
      </div>
    );
  }
  if (!timer.expiresAt) return null;

  const urgent = hoursLeft(timer.expiresAt, now) < 3;
  const keep = async () => {
    setSending(true);
    try { await onKeep(); } finally { setSending(false); }
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 text-xs border-b ${urgent ? 'bg-primary/15 border-primary/30' : 'bg-card/60 border-border/50'}`}>
      <Hourglass className={`w-3.5 h-3.5 shrink-0 ${urgent ? 'text-primary' : 'text-gold'}`} />
      <p className="flex-1 min-w-0 leading-snug">
        <span className={urgent ? 'text-foreground font-medium' : 'text-foreground/90'}>
          Disappears in {timeLeft(timer.expiresAt, now)}
        </span>
        <span className="block text-[11px] text-muted-foreground">
          {timer.iKeep
            ? 'Waiting for them to keep it too'
            : timer.theyKeep
              ? 'They want to keep this chat'
              : 'Keep it if you both want to stay in touch'}
        </span>
      </p>
      {timer.iKeep ? (
        <span className="flex items-center gap-1 text-[11px] text-gold shrink-0"><Check className="w-3.5 h-3.5" /> Kept</span>
      ) : (
        <button
          onClick={keep}
          disabled={sending}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold disabled:opacity-50 ${
            timer.theyKeep ? 'bg-gradient-to-b from-gold to-[hsl(37_40%_60%)] text-primary animate-pulse' : 'border border-gold/50 text-gold'
          }`}
        >
          Keep chat
        </button>
      )}
    </div>
  );
}
