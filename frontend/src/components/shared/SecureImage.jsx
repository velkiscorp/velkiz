import React from 'react';
import { useSecurePhoto } from '@/lib/securePhoto';

// Drop-in <img> for profile photos: loads them through the backend's
// permission check instead of a public link (see lib/securePhoto.js)
export default function SecureImage({ src, alt = '', className = '', style, ...rest }) {
  const resolved = useSecurePhoto(src);
  if (!resolved) {
    // Same box while loading, so layouts don't jump
    return <div className={`bg-secondary animate-pulse ${className}`} style={style} aria-label={alt} />;
  }
  return <img src={resolved} alt={alt} className={className} style={style} draggable={false} {...rest} />;
}
