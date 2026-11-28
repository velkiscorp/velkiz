import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Reply, Copy, Undo2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// What you can do with a message you held down: reply, copy, and unsend
// your own (it disappears for both of you)
export default function MessageActions({ message, onClose, onReply, onUnsend }) {
  const { toast } = useToast();
  // Lifting the finger that opened this can land a tap on the backdrop: ignore it
  const openedAt = useRef(0);
  useEffect(() => { if (message) openedAt.current = Date.now(); }, [message]);
  const backdropTap = () => { if (Date.now() - openedAt.current > 500) onClose(); };

  const run = (fn) => () => { const m = message; onClose(); fn(m); };

  const copy = async (m) => {
    try {
      await navigator.clipboard.writeText(m.content || '');
      toast({ title: 'Copied' });
    } catch {}
  };

  return (
    <AnimatePresence>
      {message && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={backdropTap}
            className="fixed inset-0 z-[60] bg-black/60"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[60] bg-card border-t border-border rounded-t-2xl pb-safe"
            role="menu"
          >
            <p className="px-5 pt-4 pb-2 text-sm text-muted-foreground line-clamp-2">{message.content}</p>
            <div className="py-1">
              <ActionRow icon={Reply} label="Reply" onClick={run(onReply)} />
              <ActionRow icon={Copy} label="Copy" onClick={run(copy)} />
              {message.isMine && (
                <ActionRow icon={Undo2} label="Unsend for both" danger onClick={run(onUnsend)} />
              )}
            </div>
            <button onClick={onClose} className="w-full py-4 text-sm text-muted-foreground border-t border-border/60">
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ActionRow({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-3.5 text-[15px] active:bg-white/5 ${danger ? 'text-destructive' : 'text-foreground'}`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}
