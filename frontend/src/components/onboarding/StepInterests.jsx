import React from 'react';
import { Label } from "@/components/ui/label";
import { INTEREST_OPTIONS } from '@/lib/profileOptions';

const INTEREST_TAGS = INTEREST_OPTIONS;

export default function StepInterests({ data, onChange }) {
  const selected = data.interests || [];

  const toggle = (tag) => {
    const next = selected.includes(tag)
      ? selected.filter(t => t !== tag)
      : [...selected, tag];
    onChange({ interests: next });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif italic font-medium">Your turn-ons</h2>
        <p className="text-muted-foreground text-sm">Select at least 3 to find better matches.</p>
      </div>

      <div className="space-y-3">
        <Label>Interests & Preferences</Label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className={`px-3.5 py-2 rounded-full border transition-all duration-200 text-sm font-medium ${
                selected.includes(tag)
                  ? 'border-accent bg-accent/15 text-accent shadow-[0_0_12px_hsl(340_85%_60%/0.2)]'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{selected.length} selected</p>
      </div>
    </div>
  );
}