import React from 'react';
import { SlidersHorizontal, MapPin, X } from 'lucide-react';
import { countFilters } from '@/lib/discoverFilters';
import { lookingForLabel } from '@/lib/profileOptions';

// The row above the cards: a Filters button (opens the full panel), a quick
// "Near me" toggle, and a chip for each active filter that clears it on tap.
export default function DiscoverFilters({ filters, onChange, onOpenPanel }) {
  const count = countFilters(filters);

  const chips = [];
  if (filters.lookingFor.length) chips.push({
    key: 'lookingFor',
    label: filters.lookingFor.map(lookingForLabel).join(', '),
    clear: { lookingFor: [] },
  });
  if (filters.minAge || filters.maxAge) chips.push({
    key: 'age', label: `Age ${filters.minAge || 18}-${filters.maxAge || '99+'}`, clear: { minAge: null, maxAge: null },
  });
  if (filters.maxDistanceKm) chips.push({
    key: 'distance', label: `Within ${filters.maxDistanceKm} km`, clear: { maxDistanceKm: null },
  });
  if (filters.minHeight || filters.maxHeight) chips.push({
    key: 'height', label: `Height ${filters.minHeight || 'any'}-${filters.maxHeight || 'any'} cm`, clear: { minHeight: null, maxHeight: null },
  });
  if (filters.interests.length) chips.push({
    key: 'interests',
    label: filters.interests.length === 1 ? filters.interests[0] : `${filters.interests.length} interests`,
    clear: { interests: [] },
  });

  const base = 'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] uppercase tracking-[0.18em] font-medium border transition-all duration-200';
  const on = 'border-gold/70 text-gold shadow-[0_0_16px_hsl(37_45%_74%/0.15)]';
  const off = 'border-border text-muted-foreground hover:text-foreground hover:border-gold/40';

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 pb-1" style={{ scrollbarWidth: 'none' }}>
      <button onClick={onOpenPanel} className={`${base} ${count ? on : off}`}>
        <SlidersHorizontal className="w-3 h-3" />
        Filters{count ? ` · ${count}` : ''}
      </button>
      <button
        onClick={() => onChange({ ...filters, sameRegion: !filters.sameRegion })}
        className={`${base} ${filters.sameRegion ? on : off}`}
      >
        <MapPin className="w-3 h-3" />
        My country
      </button>
      {chips.map(c => (
        <button key={c.key} onClick={() => onChange({ ...filters, ...c.clear })} className={`${base} ${on} normal-case tracking-normal`}>
          {c.label}
          <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
}
