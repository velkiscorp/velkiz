import React, { useState } from 'react';
import { Infinity as InfinityIcon, X } from 'lucide-react';
import { useUnits } from '@/lib/units';

// A keep-chat line in the conversation. Deliberately unlike the small
// screenshot pill: a wider gold card with an infinity mark, so nobody mixes
// the two up. The newest invite you haven't answered gets Keep / Not now.
const TEXT = {
  requested: { mine: 'You asked to keep this chat', theirs: 'They want to keep this chat' },
  cancelled: { mine: 'You took back your keep request', theirs: 'They took back their keep request' },
  declined: { mine: "You said not now. They can ask again.", theirs: 'They said not now. You can ask again anytime.' },
  kept: { mine: "You both kept this chat. It won't disappear.", theirs: "You both kept this chat. It won't disappear." },
};

export default function KeepBanner({ message, isMine, actionable, onKeep, onDecline }) {
  const units = useUnits();
  const [busy, setBusy] = useState(false);
  const text = TEXT[message.content] || TEXT.requested;
  const kept = message.content === 'kept';
  const run = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  return (
    <div className="flex justify-center my-4">
      <div className={`w-full max-w-[19rem] rounded-2xl border px-4 py-3 text-center ${
        kept ? 'border-gold/60 bg-gradient-to-b from-gold/20 to-gold/5' : 'border-gold/35 bg-black/40'
      }`}>
        <div className="flex items-center justify-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center ${kept ? 'bg-gold text-black' : 'bg-gold/15 text-gold'}`}>
            <InfinityIcon className="w-4 h-4" />
          </span>
          <p className="text-[13px] font-medium text-foreground/90 leading-snug text-left">
            {isMine ? text.mine : text.theirs}
          </p>
        </div>
        {actionable && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => run(onDecline)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Not now
            </button>
            <button
              onClick={() => run(onKeep)}
              disabled={busy}
              className="flex-1 rounded-full bg-gradient-to-b from-gold to-[hsl(37_40%_60%)] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
            >
              Keep chat
            </button>
          </div>
        )}
        {message.created_at && (
          <p className="text-[10px] text-muted-foreground/60 mt-1.5">{units.time(message.created_at)}</p>
        )}
      </div>
    </div>
  );
}
