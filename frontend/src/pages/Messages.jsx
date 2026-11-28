import React from 'react';
import { Link } from 'react-router-dom';
import EmptyState, { emptyCtaClass } from '@/components/shared/EmptyState';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import { splitPhoneNumbers, maskPhoneNumber } from '@/lib/phone';
import { useMatches } from '@/api/queries';
import { useUnits } from '@/lib/units';
import { Hourglass } from 'lucide-react';
import { useNow, timeLeft, hoursLeft } from '@/lib/chatTimer';

// Chat previews always mask phone numbers; revealing happens inside the chat
const maskedPreview = (text = '') =>
  splitPhoneNumbers(text).map(p => (p.isPhone ? maskPhoneNumber(p.text) : p.text)).join('');


export default function Messages() {
  const units = useUnits();
  const now = useNow(60_000);

  const { data: matchesData = {}, isLoading } = useMatches({ refetchInterval: 5000 });

  const matches = matchesData?.matches || [];



  return (
    <div className="flex flex-col h-app">
      {/* Banner */}
      <div className="shrink-0 silk-banner px-4 py-6">
        <div className="relative z-10">
          <h2 className="text-3xl font-serif italic font-medium tracking-tight text-foreground">Messages</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70 mt-1.5">{matches.length} conversation{matches.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-md bg-secondary animate-pulse" />
            ))}
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-2">
            {matches.map(match => (
              <Link
                key={match.id}
                to={`/Chat?matchId=${match.id}`}
                className="flex items-center gap-3 p-3 rounded-md bg-card/60 hover:bg-secondary transition-all duration-200 border border-border/60 hover:border-gold/30"
              >
                <div className="relative shrink-0">
                  <ProfileAvatar
                    photoUrl={match.matchedWith.photos?.[0]?.url}
                    username={match.matchedWith.username}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-gold/60 animate-gold-glow"
                    textClassName="text-xl"
                  />
                  {match.hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary ring-2 ring-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif italic text-lg leading-tight truncate text-gold">
                    {match.matchedWith.username || 'Anonymous'}
                  </h4>
                  <p className={`text-xs truncate ${match.hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {match.lastMessage ? maskedPreview(match.lastMessage.content) : 'Make the first move'}
                  </p>
                  {match.timer?.expiresAt && !match.timer.kept && (
                    <p className={`flex items-center gap-1 text-[10px] mt-0.5 ${hoursLeft(match.timer.expiresAt, now) < 3 ? 'text-primary' : 'text-gold/70'}`}>
                      <Hourglass className="w-3 h-3" /> {timeLeft(match.timer.expiresAt, now)} left
                      {match.timer.theyKeep && !match.timer.iKeep && ' · they want to keep it'}
                    </p>
                  )}
                </div>
                {match.lastMessage && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {units.time(match.lastMessage.created_at)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            variant="silk"
            word="Hush."
            title="The first toast is yours"
            className="h-full min-h-[22rem]"
            action={<Link to="/Discover" className={emptyCtaClass}>Find someone</Link>}
          >
            When you match, your conversations will wait for you here.
          </EmptyState>
        )}
      </div>
    </div>
  );
}