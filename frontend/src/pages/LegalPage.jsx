import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LEGAL, LEGAL_DOCS } from '@/lib/legal';

// /privacy, /terms and /guidelines. Open to everyone, signed in or not,
// because Apple and the signup screen link to them.
export default function LegalPage({ doc }) {
  const navigate = useNavigate();
  const { title, intro, sections } = LEGAL_DOCS[doc];
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 h-14 flex items-center gap-3">
        <button onClick={goBack} aria-label="Back" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      <article className="p-5 pb-16 max-w-2xl mx-auto w-full space-y-6 text-sm leading-relaxed">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Last updated {LEGAL.lastUpdated}</p>
          <p className="text-foreground/90">{intro}</p>
        </div>

        {sections.map((s, i) => (
          <section key={i} className="space-y-2">
            {s.h && <h2 className="text-base font-serif italic text-gold">{s.h}</h2>}
            {(s.p || []).map((t, j) => <p key={j} className="text-muted-foreground">{t}</p>)}
            {s.list && (
              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                {s.list.map((t, j) => <li key={j}>{t}</li>)}
              </ul>
            )}
            {(s.after || []).map((t, j) => <p key={j} className="text-muted-foreground">{t}</p>)}
          </section>
        ))}

        <nav className="pt-4 border-t border-border/50 flex flex-wrap gap-x-5 gap-y-2 text-xs">
          {doc !== 'privacy' && <Link to="/privacy" className="text-gold hover:underline">Privacy Policy</Link>}
          {doc !== 'terms' && <Link to="/terms" className="text-gold hover:underline">Terms of Service</Link>}
          {doc !== 'guidelines' && <Link to="/guidelines" className="text-gold hover:underline">Community Guidelines</Link>}
        </nav>
      </article>
    </div>
  );
}
