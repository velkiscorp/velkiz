import React, { useRef } from 'react';
import { Switch } from "@/components/ui/switch";
import { X, EyeOff, Eye, Plus } from 'lucide-react';
import { uploadPhoto } from '@/api/upload';
import { useToast } from "@/components/ui/use-toast";
import SecureImage from '@/components/shared/SecureImage';

export default function StepPhotos({ data, onChange }) {
  const fileRef = useRef(null);
  const photos = data.photos || [];
  const { toast } = useToast();



const handleAddPhoto = async (e) => {
  const file = e.target.files?.[0];
  if (!file || photos.length >= 4) return;
  try {
    const url = await uploadPhoto(file);
    const newPhotos = [...photos, { url, is_nsfw: false }];
    onChange({ photos: newPhotos, photo_url: newPhotos[0]?.url || '' });
  } catch (error) {
    console.error('Photo upload failed:', error);
    toast({
      variant: "destructive",
      title: "Upload failed",
      description: "Couldn't upload that photo. Check your connection and try again.",
    });
  }
  e.target.value = '';
};

  const removePhoto = (idx) => {
    const newPhotos = photos.filter((_, i) => i !== idx);
    onChange({ photos: newPhotos, photo_url: newPhotos[0]?.url || '' });
  };

  const toggleNSFW = (idx, val) => {
    const newPhotos = photos.map((p, i) => i === idx ? { ...p, is_nsfw: val } : p);
    onChange({ photos: newPhotos });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif italic font-medium">Add your photos</h2>
        <p className="text-muted-foreground text-sm">Up to 4 photos. Mark NSFW ones — they'll be blurred until revealed.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo, idx) => (
          <div key={idx} className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-secondary">
            <SecureImage src={photo.url} alt="" className="w-full h-full object-cover" />
            {photo.is_nsfw && (
              <div className="absolute inset-0 backdrop-blur-lg bg-black/40 flex items-center justify-center">
                <EyeOff className="w-8 h-8 text-white/60" />
              </div>
            )}
            <button
              onClick={() => removePhoto(idx)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            {idx === 0 && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/80 text-white text-[10px] font-bold">
                MAIN
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {photo.is_nsfw
                    ? <EyeOff className="w-3 h-3 text-amber-400" />
                    : <Eye className="w-3 h-3 text-green-400" />}
                  <span className="text-[10px] text-white">NSFW</span>
                </div>
                <Switch
                  checked={!!photo.is_nsfw}
                  onCheckedChange={(v) => toggleNSFW(idx, v)}
                  className="scale-75"
                />
              </div>
            </div>
          </div>
        ))}

        {photos.length < 4 && (
          <button
            onClick={() => fileRef.current?.click()}
            className="aspect-[3/4] rounded-2xl border-2 border-dashed border-border bg-secondary hover:border-gold/50 transition-all flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-gold" />
            </div>
            <span className="text-xs text-muted-foreground">Add photo</span>
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} />

      <p className="text-xs text-muted-foreground text-center">
        {photos.length}/4 photos added
      </p>
    </div>
  );
}