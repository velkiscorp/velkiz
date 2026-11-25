import React, { useId } from 'react';

// Empty screens: a small animated gold line drawing over a pool of red
// light ("gold" variant), or drifting red silk with rising gold dust
// ("silk" variant). Animations are switched off by prefers-reduced-motion
// in index.css.

const V_HEART =
  'M14.4 9.6 C14 7.6 12.8 6.2 11.6 5.6 C7.6 3.6 3.6 8.2 6.3 12.5 L16 27 L25.7 12.5 C28.4 8.2 24.4 3.6 20.4 5.6 C19.2 6.2 18 7.6 17.6 9.6';
const SPARKLE = 'M0 -5 C.6 -1 1 -.6 5 0 C1 .6 .6 1 0 5 C-.6 1 -1 .6 -5 0 C-1 -.6 -.6 -1 0 -5Z';

function Sparkle({ x, y, size = 1, delay = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path d={SPARKLE} fill="#e8d4b0" className="empty-twinkle" style={{ animationDelay: `${delay}s` }} />
    </g>
  );
}

function Glass({ gold, wine, className, children }) {
  return (
    <g className={className}>
      <path d="M46 40 C47 54 53 60 60 60 C67 60 73 54 74 40 Z" fill={`url(#${wine})`} opacity=".85" />
      <path
        d="M44 28 L76 28 M44 28 C44 52 52 62 60 62 C68 62 76 52 76 28 M60 62 L60 90 M47 93 C52 90.5 68 90.5 73 93"
        fill="none" stroke={`url(#${gold})`} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
      {children}
    </g>
  );
}

const DRAWINGS = {
  // A wine glass with a lipstick kiss on the rim
  glass: ({ gold, wine }) => (
    <>
      <Glass gold={gold} wine={wine} className="empty-sway">
        <path d="M71.5 27.5 c1.2-1.6 3.4-1.6 4.2.1 c.9-1.5 3.1-1.3 3.6.6 c-1.6 1.8-6 1.6-7.8-.7z" fill="#c4304f" />
      </Glass>
      <Sparkle x={26} y={34} size={0.9} />
      <Sparkle x={91} y={59} size={0.6} delay={1} />
    </>
  ),
  // A letter sealed with the V-heart in red wax
  letter: ({ gold, wine }) => (
    <>
      <path d="M24 40 h72 v46 h-72 z M24 41 L60 66 L96 41" fill="none" stroke={`url(#${gold})`} strokeWidth="1.6" strokeLinejoin="round" />
      <g className="empty-flicker">
        <circle cx="60" cy="66" r="10" fill={`url(#${wine})`} stroke="#5a0a1c" strokeWidth="1" />
        <g transform="translate(53.5 59.5) scale(.406)">
          <path d={V_HEART} fill="none" stroke={`url(#${gold})`} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      <Sparkle x={99} y={31} size={0.7} delay={1.8} />
    </>
  ),
  // A crescent moon over a quiet horizon
  moon: ({ gold }) => (
    <>
      <path d="M70 22 A30 30 0 1 0 92 76 A23 23 0 1 1 70 22 Z" fill="rgba(217,195,160,.08)" stroke={`url(#${gold})`} strokeWidth="1.6" strokeLinejoin="round" />
      <Sparkle x={30} y={30} />
      <Sparkle x={99} y={23} size={0.6} delay={1} />
      <Sparkle x={23} y={83} size={0.6} delay={1.8} />
      <path d="M14 100 L106 100" stroke={`url(#${gold})`} strokeWidth="1.6" strokeLinecap="round" opacity=".5" />
    </>
  ),
};

function GoldDrawing({ name }) {
  const id = useId().replace(/:/g, '');
  const gold = `empty-gold-${id}`;
  const wine = `empty-wine-${id}`;
  const Drawing = DRAWINGS[name];
  return (
    <svg viewBox="0 0 120 120" className="w-40 h-40 overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3e3c4" />
          <stop offset=".55" stopColor="#d9c3a0" />
          <stop offset="1" stopColor="#a8865a" />
        </linearGradient>
        <linearGradient id={wine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b3203f" />
          <stop offset="1" stopColor="#5a0a1c" />
        </linearGradient>
      </defs>
      <Drawing gold={gold} wine={wine} />
    </svg>
  );
}

const DUST = [
  { left: '12%', delay: 0 }, { left: '28%', delay: 2.2 }, { left: '46%', delay: 4.1 },
  { left: '63%', delay: 1.1 }, { left: '80%', delay: 3.3 }, { left: '90%', delay: 5.2 },
];

export default function EmptyState({ variant = 'gold', drawing, word, title, children, action, className = '' }) {
  if (variant === 'silk') {
    return (
      <div className={`relative overflow-hidden rounded-md border border-border/60 flex flex-col items-center justify-center text-center gap-4 px-6 py-16 ${className}`}>
        <div className="empty-silk" aria-hidden="true" />
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {DUST.map((d, i) => (
            <i key={i} className="empty-dust" style={{ left: d.left, animationDelay: `${d.delay}s` }} />
          ))}
        </div>
        {word && <div className="relative text-7xl font-serif italic leading-none text-silk">{word}</div>}
        <h3 className="relative text-2xl font-serif italic leading-tight max-w-[16ch]">{title}</h3>
        {children && <p className="relative text-sm text-muted-foreground max-w-[26ch]">{children}</p>}
        {action && <div className="relative">{action}</div>}
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center justify-center text-center gap-4 px-6 py-10 ${className}`}>
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ background: 'radial-gradient(circle at 50% 35%, hsl(346 75% 32% / 0.4), transparent 55%)' }}
      />
      <div className="relative"><GoldDrawing name={drawing} /></div>
      <h3 className="relative text-2xl font-serif italic leading-tight max-w-[18ch]">{title}</h3>
      {children && <p className="relative text-sm text-muted-foreground max-w-[28ch]">{children}</p>}
      {action && <div className="relative flex flex-col items-center gap-2">{action}</div>}
    </div>
  );
}

// The red call-to-action used under empty states
export const emptyCtaClass =
  'inline-flex items-center justify-center h-10 px-5 rounded-md bg-gradient-to-b from-primary to-accent text-primary-foreground text-[11px] uppercase tracking-[0.22em] font-medium shadow-[0_0_24px_hsl(346_75%_36%/0.5)] hover:brightness-110 transition';
