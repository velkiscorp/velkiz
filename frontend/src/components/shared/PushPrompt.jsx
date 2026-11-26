import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shouldOfferPush, enablePush, dismissPushOffer, startPush } from '@/lib/push';

// Asks, in our own words, whether to turn on notifications. Only "Turn on"
// shows Apple's real popup. Shown once onboarding is done, in the app only.
export default function PushPrompt() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    startPush(navigate);
    // A moment after arriving, so it doesn't cover the first screen instantly
    const t = setTimeout(async () => {
      if (!cancelled && await shouldOfferPush()) setOpen(true);
    }, 2500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [navigate]);

  const turnOn = async () => {
    setBusy(true);
    await enablePush(navigate);
    setBusy(false);
    setOpen(false);
  };

  const notNow = () => {
    dismissPushOffer();
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg rounded-t-3xl bg-card border-t border-gold/20 p-6 pb-safe space-y-5 text-center"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="mx-auto w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Bell className="w-6 h-6 text-gold" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif italic text-silk">Don't miss a match</h2>
              <p className="text-sm text-muted-foreground">
                We'll let you know when you match or get a message. Notifications never
                show names or what anyone wrote, so your lock screen stays private.
              </p>
            </div>
            <div className="space-y-2 pb-2">
              <Button className="w-full h-12 bg-gradient-to-b from-primary to-accent" onClick={turnOn} disabled={busy}>
                {busy ? 'One moment...' : 'Turn on notifications'}
              </Button>
              <Button variant="ghost" className="w-full h-11 text-muted-foreground" onClick={notNow} disabled={busy}>
                Not now
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
