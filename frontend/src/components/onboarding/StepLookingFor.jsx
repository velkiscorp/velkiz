import React from 'react';
import { Heart, Coffee, Users, Sparkles, Flame, MessageCircle } from 'lucide-react';
import { LOOKING_FOR_OPTIONS } from '@/lib/profileOptions';

const ICONS = {
  long_term: Heart, short_term: Flame, casual: Sparkles,
  online: MessageCircle, friends: Coffee, open: Users,
};
const OPTIONS = LOOKING_FOR_OPTIONS.map(o => ({ ...o, icon: ICONS[o.value] }));

export default function StepLookingFor({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif italic font-medium">What are you looking for?</h2>
        <p className="text-muted-foreground text-sm">You can change this later.</p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map(o => {
          const Icon = o.icon;
          const isSelected = data.looking_for === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange({ looking_for: o.value })}
              className={`w-full h-14 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 px-5 ${
                isSelected
                  ? 'border-gold bg-primary/10'
                  : 'border-border bg-secondary hover:border-gold/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? 'text-gold' : 'text-muted-foreground'}`} />
              <div className="text-left">
                <p className={`font-semibold text-sm ${isSelected ? 'text-gold' : 'text-foreground'}`}>{o.label}</p>
                <p className="text-xs text-muted-foreground">{o.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}