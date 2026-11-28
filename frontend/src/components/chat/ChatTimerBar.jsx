import React, { useState } from 'react';
import { Hourglass, Infinity as InfinityIcon, Check } from 'lucide-react';
import { useNow, timeLeft, hoursLeft } from '@/lib/chatTimer';

// Under the chat header: how long until this chat disappears, and the
// "Keep chat" button. Nothing shows until you've both opened the chat.
export default function ChatTimerBar({ timer, onKeep, onCancel }) {
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
  const run = (fn) => async () => {
    if (!fn) return;
    setSending(true);
    try { await fn(); } finally { setSending(false); }
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
            ? 'Waiting for them to accept'
            : timer.theyKeep
              ? 'They want to keep this chat'
              : 'Keep it if you both want to stay in touch'}
        </span>
      </p>
      {timer.iKeep ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold bg-black text-gold border border-gold/70">
            <Check className="w-3.5 h-3.5" /> Invite sent
          </span>
          <button
            onClick={run(onCancel)}
            disabled={sending}
            className="rounded-full px-2.5 py-1.5 text-[11px] text-muted-foreground border border-border/60 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={run(onKeep)}
          disabled={sending}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold bg-gradient-to-b from-gold to-[hsl(37_40%_60%)] text-primary disabled:opacity-50 ${
            timer.theyKeep ? 'animate-pulse' : ''
          }`}
        >
          Keep chat
        </button>
      )}
    </div>
  );
}
