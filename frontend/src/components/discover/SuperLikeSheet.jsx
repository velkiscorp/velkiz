import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useSuperLikes, useRefresh } from '@/api/queries';
import { superLikesApi } from '@/api/superLikes';
import { canBuy, getPacks, buyPack } from '@/lib/purchases';
import { isNativeApp } from '@/lib/native';
import { useUnits } from '@/lib/units';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Shown when you're out of Super Likes (or tap the count). One free one
// every 24 hours; more can be bought in the iPhone app.
export default function SuperLikeSheet({ onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const refresh = useRefresh();
  const units = useUnits();
  const { data: balance } = useSuperLikes();
  const [packs, setPacks] = useState(null);
  const [buying, setBuying] = useState(null);

  useEffect(() => {
    if (!canBuy()) { setPacks([]); return; }
    getPacks(user?.id)
      .then(setPacks)
      .catch((e) => { console.error('Could not load packs', e); setPacks([]); });
  }, [user?.id]);

  const buy = async (pack) => {
    setBuying(pack.id);
    try {
      const before = balance?.purchased ?? 0;
      const bought = await buyPack(user.id, pack);
      if (!bought) return;
      // Apple has charged; our server hears about it from RevenueCat a
      // moment later. Wait for the new Super Likes to show up.
      for (let i = 0; i < 10; i++) {
        const now = await superLikesApi.get().catch(() => null);
        if (now && now.purchased > before) break;
        await sleep(1500);
      }
      refresh.superLikes();
      toast({ title: `${pack.count} Super Likes added` });
      onClose();
    } catch (e) {
      console.error('Purchase failed', e);
      toast({ title: "Purchase didn't go through", description: 'You have not been charged. Please try again.', variant: 'destructive' });
    } finally {
      setBuying(null);
    }
  };

  const nextFree = balance?.nextFreeAt ? new Date(balance.nextFreeAt) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
        className="w-full max-w-sm max-h-[90dvh] overflow-y-auto bg-card border border-border rounded-t-3xl sm:rounded-3xl p-6 space-y-5"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end -mt-2 -mr-2">
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-2 -mt-6">
          <Star className="w-10 h-10 text-gold mx-auto" fill="currentColor" />
          <h2 className="text-2xl font-serif italic text-silk">Super Likes</h2>
          <p className="text-sm text-muted-foreground">
            They know you're really interested, and you stand out in their likes.
          </p>
        </div>

        <div className="rounded-2xl bg-black/30 border border-border/60 p-4 text-sm text-center space-y-1">
          <p>You have <span className="text-gold font-medium">{balance?.total ?? 0}</span> left</p>
          <p className="text-xs text-muted-foreground">
            {balance?.freeAvailable
              ? 'Your free one for today is ready.'
              : nextFree
                ? `Your next free one arrives ${units.date(nextFree)} at ${units.time(nextFree)}.`
                : 'You get one free every 24 hours.'}
          </p>
        </div>

        {packs === null ? (
          <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : packs.length ? (
          <div className="space-y-2">
            {packs.map((pack) => (
              <Button
                key={pack.id}
                onClick={() => buy(pack)}
                disabled={!!buying}
                variant="outline"
                className="w-full h-14 justify-between rounded-xl border-gold/40 bg-black/30 hover:bg-gold/10"
              >
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gold" fill="currentColor" />
                  {pack.count} Super Likes
                </span>
                {buying === pack.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-gold">{pack.price}</span>}
              </Button>
            ))}
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Paid through your Apple ID. Super Likes don't expire and aren't refunded if you undo one.
            </p>
          </div>
        ) : isNativeApp() ? null : (
          // In the app with no packs on sale yet, say nothing about buying
          <p className="text-xs text-muted-foreground text-center">More Super Likes can be bought in the Velkiz iPhone app.</p>
        )}
      </motion.div>
    </motion.div>
  );
}
