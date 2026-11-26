import React from 'react';
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck, Mars, Venus, NonBinary, Sparkle } from 'lucide-react';

const GENDERS = [
  { value: 'male', label: 'Male', Icon: Mars },
  { value: 'female', label: 'Female', Icon: Venus },
  { value: 'non_binary', label: 'Non-binary', Icon: NonBinary },
  { value: 'other', label: 'Other', Icon: Sparkle },
];

const ORIENTATIONS = [
  { value: 'heterosexual', label: 'Straight' },
  { value: 'bisexual', label: 'Bisexual' },
  { value: 'gay', label: 'Gay' },
  { value: 'lesbian', label: 'Lesbian' },
  { value: 'pansexual', label: 'Pansexual' },
];

export default function StepGenderOrientation({ data, onChange }) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif italic font-medium">About you</h2>
        <p className="text-muted-foreground text-sm">This helps us find your matches.</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label>Gender</Label>
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {GENDERS.map(g => (
            <button
              key={g.value}
              onClick={() => onChange({ gender: g.value })}
              className={`h-14 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 font-medium ${
                data.gender === g.value
                  ? 'border-gold bg-primary/10 text-gold'
                  : 'border-border bg-secondary text-foreground hover:border-gold/50'
              }`}
            >
              <g.Icon className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden="true" />
              {g.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            Gender cannot be changed after signup. Profile verification will confirm your identity.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Orientation</Label>
        <div className="flex flex-wrap gap-2">
          {ORIENTATIONS.map(o => (
            <button
              key={o.value}
              onClick={() => onChange({ orientation: o.value })}
              className={`px-4 py-2.5 rounded-full border-2 transition-all duration-200 text-sm font-medium ${
                data.orientation === o.value
                  ? 'border-gold bg-primary/10 text-gold'
                  : 'border-border bg-secondary text-foreground hover:border-gold/50'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}