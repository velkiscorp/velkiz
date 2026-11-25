import React, { useId } from 'react';

// The Velkis mark: a V whose arms curl into two heart lobes that almost
// meet at the top, leaving a small gap so the V still reads.
const VELVET_MARK_PATH =
  'M14.4 9.6 C14 7.6 12.8 6.2 11.6 5.6 C7.6 3.6 3.6 8.2 6.3 12.5 L16 27 L25.7 12.5 C28.4 8.2 24.4 3.6 20.4 5.6 C19.2 6.2 18 7.6 17.6 9.6';

export default function VelvetLogo({ className = "w-8 h-8" }) {
  // Unique gradient id, so several logos on one page don't share one
  const gradientId = `velvet-gold-${useId().replace(/:/g, '')}`;

  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-label="Velkis" role="img">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3e3c4" />
          <stop offset="0.55" stopColor="#d9c3a0" />
          <stop offset="1" stopColor="#a8865a" />
        </linearGradient>
      </defs>
      <path
        d={VELVET_MARK_PATH}
        stroke={`url(#${gradientId})`}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
