import React, { useState } from 'react';
import { format } from 'date-fns';
import { ShieldAlert } from 'lucide-react';
import { splitPhoneNumbers, maskPhoneNumber } from '@/lib/phone';

export default function ChatBubble({ message, isMine }) {
  const [revealed, setRevealed] = useState(false);
  const flagged = !!message.is_filtered;
  const parts = flagged ? splitPhoneNumbers(message.content || '') : null;

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
            {format(new Date(message.created_at), 'h:mm a')}
          </span>
        </div>
      </div>
    </div>
  );
}
