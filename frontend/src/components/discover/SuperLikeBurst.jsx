import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const SPARKS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const dist = 110 + (i % 3) * 30;
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 10 + (i % 3) * 5, delay: (i % 4) * 0.03 };
});

// A gold star that bursts over the screen when you send a Super Like
export default function SuperLikeBurst({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1300);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none flex items-center justify-center" aria-hidden>
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(37_60%_60%/0.35),transparent_60%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.2, times: [0, 0.25, 1] }}
      />
      <motion.div
        className="absolute w-40 h-40 rounded-full border-2 border-gold"
        initial={{ scale: 0.2, opacity: 0.9 }}
        animate={{ scale: 2.6, opacity: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      {SPARKS.map((s, i) => (
        <motion.div
          key={i}
          className="absolute text-gold"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: s.x, y: s.y, scale: 1, opacity: 0, rotate: 180 }}
          transition={{ duration: 0.9, delay: 0.1 + s.delay, ease: 'easeOut' }}
        >
          <Star style={{ width: s.size, height: s.size }} fill="currentColor" />
        </motion.div>
      ))}
      <motion.div
        className="relative text-gold drop-shadow-[0_0_30px_hsl(37_60%_60%/0.8)]"
        initial={{ scale: 0.2, rotate: -90, opacity: 0 }}
        animate={{ scale: [0.2, 1.35, 1], rotate: [-90, 15, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.2, times: [0, 0.35, 0.6, 1], ease: 'easeOut' }}
      >
        <Star className="w-32 h-32" fill="currentColor" strokeWidth={1} />
        <span className="absolute inset-0 flex items-center justify-center font-serif italic text-lg text-primary pt-2">Super</span>
      </motion.div>
    </div>
  );
}
