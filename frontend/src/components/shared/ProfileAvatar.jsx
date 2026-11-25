import React from 'react';
import SecureImage from './SecureImage';

// Deterministic color per username, so the same person always gets the same
// color and different people look distinct - without ever standing in a
// specific stock photo for everyone who hasn't uploaded a picture
const GRADIENTS = [
  'from-rose-800 to-rose-950',
  'from-red-900 to-stone-950',
  'from-amber-900 to-rose-950',
  'from-fuchsia-900 to-zinc-950',
  'from-stone-500 to-stone-900',
  'from-pink-900 to-red-950',
];

const gradientFor = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
};

export default function ProfileAvatar({ photoUrl, username, className = '', textClassName = 'text-2xl' }) {
  if (photoUrl) {
    return <SecureImage src={photoUrl} alt={username || 'Profile'} className={className} />;
  }

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br ${gradientFor(username)} text-[hsl(37_45%_80%)] font-serif italic ${className}`}>
      <span className={textClassName}>{username?.[0]?.toUpperCase() || '?'}</span>
    </div>
  );
}