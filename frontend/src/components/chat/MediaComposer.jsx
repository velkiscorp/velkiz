import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff, ArrowUp } from 'lucide-react';

// Full-screen preview of a photo or video before sending it.
// The eye button switches view-once on (red) or off (keeps it in the chat).
// Drawn on <body>: inside the chat it would be trapped by the text bar's
// blur, which pins "fixed" elements to the bar instead of the screen.
export default function MediaComposer({ file, viewOnce, onToggleViewOnce, onSend, onClose, sending }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  const isVideo = file.type.startsWith('video/');

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black flex flex-col pt-safe pb-safe"
    >
      <div className="flex items-center px-3 h-14 shrink-0">
        <button onClick={onClose} aria-label="Don't send" className="w-11 h-11 flex items-center justify-center text-white">
          <X className="w-7 h-7" />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center px-2">
        {isVideo ? (
          <video src={url} autoPlay loop muted playsInline className="max-w-full max-h-full rounded-lg" />
        ) : (
          <img src={url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
        )}
      </div>

      <div className="shrink-0 flex items-end justify-between px-6 pt-4 pb-5">
        <button
          onClick={onToggleViewOnce}
          aria-pressed={viewOnce}
          aria-label={viewOnce ? 'One-time view is on' : 'One-time view is off'}
          className="flex flex-col items-center gap-1.5 w-24"
        >
          <span className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            viewOnce ? 'bg-primary text-white shadow-[0_0_20px_hsl(346_75%_36%/0.6)]' : 'bg-white/15 text-white/80'
          }`}>
            {viewOnce ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </span>
          <span className="text-[11px] text-white/80 leading-tight text-center">
            {viewOnce ? 'One-time view' : 'Keep in chat'}
          </span>
        </button>

        <button
          onClick={onSend}
          disabled={sending}
          aria-label={`Send ${isVideo ? 'video' : 'photo'}`}
          className="w-14 h-14 rounded-full bg-gradient-to-b from-primary to-accent flex items-center justify-center shadow-[0_0_24px_hsl(346_75%_36%/0.6)] disabled:opacity-50"
        >
          <ArrowUp className="w-6 h-6 text-white" />
        </button>
      </div>
    </motion.div>,
    document.body
  );
}
