import React from 'react';
import { useMyProfile } from '@/api/queries';

// A faint, repeating "@your_username" across a photo. Screenshots are blank
// in the iPhone app, but someone could still photograph the screen with
// another phone, or screenshot the website. The watermark means a leaked
// photo shows who leaked it.
export default function Watermark({ className = '' }) {
  const { data } = useMyProfile();
  const name = data?.profile?.username;
  if (!name) return null;

  const text = `@${name}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="140"><text x="110" y="70" fill="white" fill-opacity="0.09" font-family="sans-serif" font-size="15" font-weight="600" text-anchor="middle" transform="rotate(-28 110 70)">${text.replace(/[<&>"]/g, '')}</text></svg>`;

  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none select-none ${className}`}
      style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`, backgroundRepeat: 'repeat' }}
    />
  );
}
