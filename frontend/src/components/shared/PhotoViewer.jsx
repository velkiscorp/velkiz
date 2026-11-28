import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import SecureImage from '@/components/shared/SecureImage';

// Full-screen photo viewer. photos: [{ url, is_nsfw }], startIndex: number.
// NSFW photos start blurred and are revealed with a tap.
// Drawn on <body> so a blurred or moving parent (a chat bubble) can't trap it.
export default function PhotoViewer({ photos, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [revealed, setRevealed] = useState({});
  const photo = photos[index];

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(photos.length - 1, i + 1));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!photo) return null;
  const blurred = photo.is_nsfw && !revealed[index];

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center pt-safe pb-safe" onClick={onClose}>
      <SecureImage
        src={photo.url}
        alt=""
        className="max-w-full max-h-full object-contain transition-[filter]"
        style={blurred ? { filter: 'blur(24px)' } : undefined}
        onClick={(e) => { e.stopPropagation(); if (blurred) setRevealed(r => ({ ...r, [index]: true })); }}
      />
      {blurred && (
        <p className="absolute text-white/80 text-sm pointer-events-none">Tap to reveal</p>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        aria-label="Close"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {photos.length > 1 && (
        <>
          {index > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          {index < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}
          <p className="absolute bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] text-white/70 text-xs">{index + 1} / {photos.length}</p>
        </>
      )}
    </div>,
    document.body
  );
}
