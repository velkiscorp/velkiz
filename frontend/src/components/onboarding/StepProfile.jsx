import React, { useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, X } from 'lucide-react';
import { uploadPhoto } from '@/api/upload';
import SecureImage from '@/components/shared/SecureImage';

export default function StepProfile({ data, onChange }) {
  const fileRef = useRef(null);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadPhoto(file);
      onChange({ photo_url: url });
    } catch (error) {
      console.error('Photo upload failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif italic font-medium">Your profile</h2>
        <p className="text-muted-foreground text-sm">Add a photo and bio. Both optional.</p>
      </div>

      {/* Photo Upload */}
      <div className="flex justify-center">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative w-28 h-28 rounded-2xl border-2 border-dashed border-border bg-secondary hover:border-gold/50 transition-all duration-200 flex items-center justify-center overflow-hidden group"
        >
          {data.photo_url ? (
            <>
              <SecureImage src={data.photo_url} alt="Profile" className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); onChange({ photo_url: '' }); }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="text-center">
              <Camera className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">Add photo</span>
            </div>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
      </div>

      <div className="space-y-3">
        <Label htmlFor="bio">Short bio</Label>
        <Textarea
          id="bio"
          placeholder="Something mysterious..."
          value={data.bio || ''}
          onChange={(e) => onChange({ bio: e.target.value })}
          className="bg-secondary border-border/50 min-h-[80px]"
          maxLength={200}
        />
      </div>

      <div className="space-y-3">
        <Label>My typical Sunday looks like...</Label>
        <Input
          placeholder="Your answer..."
          value={data.prompt1 || ''}
          onChange={(e) => onChange({ prompt1: e.target.value })}
          className="h-11 bg-secondary border-border/50"
        />
      </div>

      <div className="space-y-3">
        <Label>Biggest turn-on...</Label>
        <Input
          placeholder="Your answer..."
          value={data.prompt2 || ''}
          onChange={(e) => onChange({ prompt2: e.target.value })}
          className="h-11 bg-secondary border-border/50"
        />
      </div>

      <div className="space-y-3">
        <Label>Perfect night would be...</Label>
        <Input
          placeholder="Your answer..."
          value={data.prompt3 || ''}
          onChange={(e) => onChange({ prompt3: e.target.value })}
          className="h-11 bg-secondary border-border/50"
        />
      </div>
    </div>
  );
}