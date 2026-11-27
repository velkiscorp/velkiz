import React, { useState } from 'react';
import { ShieldAlert, Camera, Phone, Video, PhoneMissed } from 'lucide-react';
import { splitPhoneNumbers, maskPhoneNumber } from '@/lib/phone';
import { useUnits } from '@/lib/units';

export default function ChatBubble({ message, isMine }) {
  const units = useUnits();
  const [revealed, setRevealed] = useState(false);
  const flagged = !!message.is_filtered;
  const parts = flagged ? splitPhoneNumbers(message.content || '') : null;

  if (message.kind === 'screenshot') {
    return (
      <div className="flex justify-center mb-3">
        <p className="flex items-center gap-1.5 text-[11px] text-gold/70 px-3 py-1 rounded-full border border-gold/20 bg-gold/5">
          <Camera className="w-3 h-3" />
          {isMine ? 'You took a screenshot' : 'They took a screenshot'}
          {message.created_at && <span className="text-muted-foreground/60">· {units.time(message.created_at)}</span>}
        </p>
      </div>
    );
  }

  if (message.kind === 'call') {
    const text = message.content || 'Call';
    const missed = /^(Missed|Declined)/.test(text);
    const Icon = missed ? PhoneMissed : /video/i.test(text) ? Video : Phone;
    return (
      <div className="flex justify-center mb-3">
        <p className={`flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full border ${missed && !isMine ? 'text-primary border-primary/30 bg-primary/5' : 'text-gold/70 border-gold/20 bg-gold/5'}`}>
          <Icon className="w-3 h-3" />
          {text}
          {message.created_at && <span className="text-muted-foreground/60">· {units.time(message.created_at)}</span>}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="max-w-[75%] space-y-1">
        {message.content && (
          <div
            className={`px-4 py-2.5 ${
              isMine
                ? 'bg-gradient-to-b from-primary to-accent text-primary-foreground rounded-md rounded-br-none shadow-[0_6px_20px_-8px_hsl(346_75%_36%/0.7)]'
                : 'bg-card/70 border-l-2 border-gold/60 rounded-r-md'
            }`}
          >
            <p className="text-[15px] leading-relaxed break-words">
              {flagged
                ? parts.map((part, i) => part.isPhone ? (
                    revealed ? (
                      <span key={i} className="font-medium">{part.text}</span>
                    ) : (
                      <button
                        key={i}
                        onClick={() => setRevealed(true)}
                        className="font-mono underline decoration-dotted underline-offset-2"
                        title="Tap to reveal"
                      >
                        {maskPhoneNumber(part.text)}
                      </button>
                    )
                  ) : (
                    <React.Fragment key={i}>{part.text}</React.Fragment>
                  ))
                : message.content}
            </p>
          </div>
        )}

        {flagged && (
          <div className={`flex items-start gap-1.5 px-1 text-[11px] leading-snug text-amber-400/90 ${isMine ? 'justify-end text-right' : ''}`}>
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>
              {isMine
                ? 'Your number is hidden until they tap to reveal it.'
                : revealed
                  ? 'Only share contact details with people you trust. Never send money, codes or passwords.'
                  : 'This message contains a phone number. Tap it to reveal. Be careful who you share contact details with.'}
            </span>
          </div>
        )}

        <div className={`flex items-center gap-2 px-1 ${isMine ? 'justify-end' : ''}`}>
          <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
            {units.time(message.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
