import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMPTY_FILTERS } from '@/lib/discoverFilters';
import { SHOW_ME_OPTIONS, LOOKING_FOR_OPTIONS, INTEREST_OPTIONS, HEIGHT_OPTIONS } from '@/lib/profileOptions';
import { useUnits } from '@/lib/units';

const AGES = Array.from({ length: 82 }, (_, i) => 18 + i); // 18-99

const Section = ({ title, hint, children }) => (
  <section className="space-y-2">
    <div className="flex items-baseline justify-between">
      <h4 className="text-[11px] font-medium text-gold/80 uppercase tracking-[0.2em]">{title}</h4>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
    {children}
  </section>
);

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
      active ? 'bg-gradient-to-r from-primary to-accent border-transparent text-white' : 'bg-secondary border-border/40 text-muted-foreground hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

const selectClass = 'flex-1 h-10 rounded-md bg-secondary border border-border/50 px-3 text-sm';

// Full-screen-ish panel to edit every Discover filter, applied on "Show people"
export default function FilterPanel({ filters, hasLocation, onApply, onClose }) {
  const [draft, setDraft] = useState(filters);
  const set = (patch) => setDraft(d => ({ ...d, ...patch }));
  const toggle = (key, value) => set({
    [key]: draft[key].includes(value) ? draft[key].filter(v => v !== value) : [...draft[key], value],
  });
  const num = (v) => (v ? Number(v) : null);
  const units = useUnits();

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40 }} animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[88vh] bg-card border border-border rounded-t-2xl sm:rounded-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-border/60 shrink-0">
          <h3 className="text-lg font-serif italic">Filters</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <Section title="Show me" hint="Based on your orientation if none picked">
            <div className="flex flex-wrap gap-2">
              <Chip active={!draft.showMe.length} onClick={() => set({ showMe: [] })}>My orientation</Chip>
              {SHOW_ME_OPTIONS.map(o => (
                <Chip key={o.value} active={draft.showMe.includes(o.value)} onClick={() => toggle('showMe', o.value)}>{o.label}</Chip>
              ))}
            </div>
          </Section>

          <Section title="Looking for" hint="Any if none picked">
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map(o => (
                <Chip key={o.value} active={draft.lookingFor.includes(o.value)} onClick={() => toggle('lookingFor', o.value)}>{o.label}</Chip>
              ))}
            </div>
          </Section>

          <Section title="Age">
            <div className="flex items-center gap-2">
              <select aria-label="Minimum age" className={selectClass} value={draft.minAge || ''} onChange={e => set({ minAge: num(e.target.value) })}>
                <option value="">From 18</option>
                {AGES.filter(a => !draft.maxAge || a <= draft.maxAge).map(a => <option key={a} value={a}>From {a}</option>)}
              </select>
              <select aria-label="Maximum age" className={selectClass} value={draft.maxAge || ''} onChange={e => set({ maxAge: num(e.target.value) })}>
                <option value="">Any age</option>
                {AGES.filter(a => !draft.minAge || a >= draft.minAge).map(a => <option key={a} value={a}>To {a}</option>)}
              </select>
            </div>
          </Section>

          <Section title="Distance" hint={hasLocation ? 'From your city' : 'Needs your city on your profile'}>
            <select aria-label="Maximum distance" className={`${selectClass} w-full`} disabled={!hasLocation}
              value={draft.maxDistanceKm || ''} onChange={e => set({ maxDistanceKm: num(e.target.value) })}>
              <option value="">Any distance</option>
              {units.distanceOptions.map(o => <option key={o.value} value={o.value}>Within {o.label}</option>)}
              {draft.maxDistanceKm && !units.distanceOptions.some(o => o.value === draft.maxDistanceKm) && (
                <option value={draft.maxDistanceKm}>Within {units.distance(draft.maxDistanceKm)}</option>
              )}
            </select>
          </Section>

          <Section title="Height" hint="Hides people who didn't add one">
            <div className="flex items-center gap-2">
              <select aria-label="Minimum height" className={selectClass} value={draft.minHeight || ''} onChange={e => set({ minHeight: num(e.target.value) })}>
                <option value="">Any</option>
                {HEIGHT_OPTIONS.filter(cm => !draft.maxHeight || cm <= draft.maxHeight).map(cm => <option key={cm} value={cm}>From {units.heightLong(cm)}</option>)}
              </select>
              <select aria-label="Maximum height" className={selectClass} value={draft.maxHeight || ''} onChange={e => set({ maxHeight: num(e.target.value) })}>
                <option value="">Any</option>
                {HEIGHT_OPTIONS.filter(cm => !draft.minHeight || cm >= draft.minHeight).map(cm => <option key={cm} value={cm}>To {units.heightLong(cm)}</option>)}
              </select>
            </div>
          </Section>

          <Section title="Interests" hint="Shows people with any of these">
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(tag => (
                <Chip key={tag} active={draft.interests.includes(tag)} onClick={() => toggle('interests', tag)}>{tag}</Chip>
              ))}
            </div>
          </Section>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-border/60 shrink-0">
          <Button variant="outline" className="flex-1" onClick={() => setDraft({ ...EMPTY_FILTERS, sameRegion: draft.sameRegion })}>
            Clear all
          </Button>
          <Button className="flex-1 bg-gradient-to-r from-primary to-accent text-white" onClick={() => onApply(draft)}>
            Show people
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
