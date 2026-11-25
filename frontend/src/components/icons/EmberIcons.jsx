import React from 'react';

// Ouroboros — snake eating its tail (Discover)
export function OuroborosIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <path
        d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      />
      <path
        d="M21 12c0-.8-.1-1.58-.28-2.33"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      />
      {/* Snake head at the tail */}
      <ellipse cx="20.5" cy="7.5" rx="1.8" ry="1.2" fill="currentColor" transform="rotate(-40 20.5 7.5)" />
      {/* Tongue */}
      <path d="M19.2 6.5 l-1 -0.8 M19.2 6.5 l-0.6 -1.2" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      {/* Scales pattern */}
      <path d="M6 8.5 Q7 7.5 8 8.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
      <path d="M9 5.5 Q10 4.5 11 5.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}

// Heart with arrow (Matches)
export function HeartArrowIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <path
        d="M12 21C12 21 3 15 3 8.5A4.5 4.5 0 0 1 12 6.5 4.5 4.5 0 0 1 21 8.5C21 12.5 17 16.5 12 21Z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
        fill="currentColor" fillOpacity="0.15"
      />
      {/* Arrow through heart */}
      <line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <polyline points="14,5 19,5 19,10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Sealed scroll with lips seal (Messages)
export function ScrollSealIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      {/* Scroll body */}
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      {/* Scroll rolled ends */}
      <path d="M5 7 Q2.5 7 2.5 5.5 Q2.5 4 5 4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M19 7 Q21.5 7 21.5 5.5 Q21.5 4 19 4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 17 Q2.5 17 2.5 18.5 Q2.5 20 5 20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M19 17 Q21.5 17 21.5 18.5 Q21.5 20 19 20" stroke="currentColor" strokeWidth="1.5" />
      {/* Ribbon/seal band */}
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1" />
      {/* Lips seal in center */}
      <path d="M10 12 Q12 10.5 14 12 Q12 13.5 10 12Z" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

// Lion (male profile) / Tigress (female profile)
export function LionIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      {/* Mane */}
      <circle cx="12" cy="13" r="7" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
      <circle cx="12" cy="13" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
      {/* Eyes */}
      <circle cx="10.5" cy="12" r="0.8" fill="currentColor" />
      <circle cx="13.5" cy="12" r="0.8" fill="currentColor" />
      {/* Nose */}
      <path d="M11.5 13.5 L12 14 L12.5 13.5" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      {/* Whiskers */}
      <line x1="7" y1="13" x2="10" y2="13.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="7" y1="14.5" x2="10" y2="14" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="17" y1="13" x2="14" y2="13.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="17" y1="14.5" x2="14" y2="14" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      {/* Ears */}
      <path d="M8 8 L9.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 8 L14.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TigressIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" {...props}>
      {/* Head */}
      <ellipse cx="12" cy="13" rx="6" ry="5.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.1" />
      {/* Seductive eyes — slightly lidded */}
      <path d="M9 11.5 Q10.5 10.5 11 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="10" cy="11.8" r="0.6" fill="currentColor" />
      <path d="M13 11.5 Q14.5 10.5 15 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="14" cy="11.8" r="0.6" fill="currentColor" />
      {/* Lashes */}
      <line x1="9" y1="10.8" x2="8.5" y2="10" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <line x1="10" y1="10.5" x2="10" y2="9.7" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <line x1="15" y1="10.8" x2="15.5" y2="10" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <line x1="14" y1="10.5" x2="14" y2="9.7" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      {/* Nose */}
      <ellipse cx="12" cy="13.2" rx="0.8" ry="0.5" fill="currentColor" opacity="0.6" />
      {/* Lips */}
      <path d="M10.5 14.5 Q12 15.5 13.5 14.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      {/* Stripe markings */}
      <path d="M8.5 10.5 Q8 9 8.5 8" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <path d="M15.5 10.5 Q16 9 15.5 8" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      {/* Ears */}
      <path d="M9 8.5 L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 8.5 L14 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}