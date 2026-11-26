import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LogOut, Save, Shield, Eye, EyeOff, X, Plus, MapPin, Calendar, Flame, Settings, Ruler, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { profilesApi } from '@/api/profiles';
import { uploadPhoto } from '@/api/upload';
import { useToast } from "@/components/ui/use-toast";
import PhotoViewer from '@/components/shared/PhotoViewer';
import SecureImage from '@/components/shared/SecureImage';
import { useMyProfile, useRefresh } from '@/api/queries';
import { LOOKING_FOR_OPTIONS, lookingForLabel, HEIGHT_OPTIONS, INTEREST_OPTIONS } from '@/lib/profileOptions';
import { useUnits } from '@/lib/units';

const INTERESTS = INTEREST_OPTIONS;


// Same rule as the backend (validation/schemas.js)
const USERNAME_RE = /^[a-z0-9_.]{3,24}$/;

// Turn an API error into something readable
const errorMessage = (err) =>
  err?.details?.[0]?.message || err?.error || "Couldn't save your changes. Please try again.";

const ORIENTATION_OPTIONS = {
  male: [
    { value: 'heterosexual', label: 'Straight' },
    { value: 'gay', label: 'Gay' },
    { value: 'bisexual', label: 'Bi' },
  ],
  female: [
    { value: 'heterosexual', label: 'Straight' },
    { value: 'lesbian', label: 'Lesbian' },
    { value: 'bisexual', label: 'Bi' },
  ],
  non_binary: [
    { value: 'heterosexual', label: 'Straight' },
    { value: 'bisexual', label: 'Bi' },
    { value: 'pansexual', label: 'Pan' },
  ],
  other: [
    { value: 'heterosexual', label: 'Straight' },
    { value: 'bisexual', label: 'Bi' },
    { value: 'pansexual', label: 'Pan' },
  ],
};

export default function MyProfile() {
  const units = useUnits();
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const fileRef = useRef(null);
  const refresh = useRefresh();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const { data: profileData, isLoading } = useMyProfile();

  const profile = profileData?.profile;

  useEffect(() => {
    if (profile) setEditData(profile);
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data) => profilesApi.updateMyProfile(data),
    // Reloads your profile on every screen (Discover, nav bar, here)
    onSuccess: () => refresh.myProfile(),
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadPhoto(file);
      const existing = editData.photos || [];
      if (existing.length >= 4) return;
      const newPhotos = [...existing, { url, is_nsfw: false }];
      const updated = { ...editData, photos: newPhotos, photo_url: newPhotos[0]?.url };
      setEditData(updated);
      updateMutation.mutate({ photos: newPhotos, photo_url: newPhotos[0]?.url });
    } catch (error) {
      console.error('Photo upload failed:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Couldn't upload that photo. Check your connection and try again.",
      });
    }
  };

  const removePhoto = (idx) => {
    const newPhotos = (editData.photos || []).filter((_, i) => i !== idx);
    const updated = { ...editData, photos: newPhotos, photo_url: newPhotos[0]?.url || '' };
    setEditData(updated);
    updateMutation.mutate({ photos: newPhotos, photo_url: newPhotos[0]?.url || '' });
  };

  const toggleNsfw = (idx) => {
    const newPhotos = (editData.photos || []).map((p, i) => i === idx ? { ...p, is_nsfw: !p.is_nsfw } : p);
    setEditData(d => ({ ...d, photos: newPhotos }));
    updateMutation.mutate({ photos: newPhotos });
  };

  const toggleInterest = (tag) => {
    const current = editData.interests || [];
    const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
    setEditData(d => ({ ...d, interests: updated }));
  };

  const username = (editData.username || '').trim();
  const usernameChanged = !!profile && username !== (profile.username || '');
  const usernameError = usernameChanged && !USERNAME_RE.test(username)
    ? '3-24 characters: lowercase letters, numbers, _ and . only'
    : null;

  const handleSave = async () => {
    if (usernameError) return;
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        // Only send the username when it changed, so an unchanged one
        // never trips the "already taken" check
        ...(usernameChanged ? { username } : {}),
        bio: editData.bio,
        looking_for: editData.looking_for,
        prompt1: editData.prompt1,
        prompt2: editData.prompt2,
        prompt3: editData.prompt3,
        show_age: editData.show_age,
        height_cm: editData.height_cm ? Number(editData.height_cm) : null,
        is_couple: !!editData.is_couple,
        hide_city: !!editData.hide_city,
        interests: editData.interests,
        orientation: editData.orientation,
      });
      toast({ title: 'Profile saved' });
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't save", description: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-app">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-app p-6 text-center space-y-4">
        <h3 className="text-lg font-semibold">No profile yet</h3>
        <Button onClick={() => navigate('/Onboarding')} className="bg-gradient-to-r from-primary to-accent text-white">
          Create Profile
        </Button>
      </div>
    );
  }

  const orientationOptions = ORIENTATION_OPTIONS[profile.gender] || ORIENTATION_OPTIONS.other;

  return (
    <div className="flex flex-col h-app">
      {/* Sticky top header */}
      <div className="shrink-0 silk-banner px-4 py-6 space-y-4">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-3xl font-serif italic font-medium tracking-tight text-foreground">
              {profile.username}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] uppercase tracking-[0.18em] text-gold/70">
              {profile.age && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{profile.age}</span>}
              {(profile.city || profile.country) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[profile.city, profile.country].filter(Boolean).join(', ')}</span>}
              {profile.height_cm && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{units.height(profile.height_cm)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/Settings')}
              className="w-8 h-8 rounded-full border border-gold/30 hover:bg-gold/10 flex items-center justify-center transition-colors"
            >
              <Settings className="w-4 h-4 text-gold" />
            </button>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-gold/70">
              <Shield className="w-3.5 h-3.5 text-gold" />
              <span>Anonymous</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 relative z-10">
          {profile.gender && (
            <Badge className="rounded-sm bg-transparent text-gold border border-gold/50 text-[10px] font-medium uppercase tracking-[0.12em] hover:bg-transparent">
              {profile.gender.replace('_', ' ')}
            </Badge>
          )}
          {profile.orientation && (
            <Badge className="rounded-sm bg-transparent text-gold border border-gold/50 text-[10px] font-medium uppercase tracking-[0.12em] hover:bg-transparent">
              {profile.orientation.replace('_', ' ')}
            </Badge>
          )}
          {profile.looking_for && (
            <Badge className="rounded-sm bg-primary text-primary-foreground border-transparent text-[10px] font-medium uppercase tracking-[0.12em] flex items-center gap-1 hover:bg-primary">
              <Flame className="w-2.5 h-2.5" />{lookingForLabel(profile.looking_for) || profile.looking_for}
            </Badge>
          )}
          {profile.is_couple && (
            <Badge className="rounded-sm bg-transparent text-gold border border-gold/50 text-[10px] font-medium uppercase tracking-[0.12em] flex items-center gap-1 hover:bg-transparent">
              <Users className="w-2.5 h-2.5" />Couple
            </Badge>
          )}
        </div>

        {profile.interests?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 relative z-10">
            {profile.interests.slice(0, 6).map(tag => (
              <span key={tag} className="text-[11px] px-2 py-0.5 rounded-sm border border-border text-muted-foreground">
                {tag}
              </span>
            ))}
            {profile.interests.length > 6 && (
              <span className="text-[11px] px-2 py-0.5 rounded-sm border border-border text-muted-foreground">
                +{profile.interests.length - 6}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scrollable edit section */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

        {/* Edit profile: name, what you're looking for, bio */}
        <section className="space-y-4 p-4 rounded-md bg-card/60 border border-border/60">
          <h4 className="text-[11px] font-medium text-gold/80 uppercase tracking-[0.2em]">Edit profile</h4>

          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs text-muted-foreground">Username</label>
            <Input
              id="username"
              value={editData.username || ''}
              onChange={(e) => setEditData(d => ({ ...d, username: e.target.value.toLowerCase() }))}
              maxLength={24}
              autoComplete="off"
              autoCapitalize="none"
              className={`bg-secondary border-border/50 ${usernameError ? 'border-destructive' : ''}`}
            />
            <p className={`text-[11px] ${usernameError ? 'text-destructive' : 'text-muted-foreground'}`}>
              {usernameError || 'This is the only name people see. Never use your real name.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Looking for</label>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setEditData(d => ({ ...d, looking_for: opt.value }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                    editData.looking_for === opt.value
                      ? 'bg-gradient-to-r from-primary to-accent border-transparent text-white'
                      : 'bg-secondary border-border/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="height" className="text-xs text-muted-foreground">Height</label>
            <select
              id="height"
              value={editData.height_cm || ''}
              onChange={(e) => setEditData(d => ({ ...d, height_cm: e.target.value ? Number(e.target.value) : null }))}
              className="w-full h-10 rounded-md bg-secondary border border-border/50 px-3 text-sm"
            >
              <option value="">Prefer not to say</option>
              {HEIGHT_OPTIONS.map(cm => <option key={cm} value={cm}>{units.heightLong(cm)}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">We're a couple</p>
              <p className="text-[11px] text-muted-foreground">Shows a Couple tag on your profile</p>
            </div>
            <Switch
              checked={!!editData.is_couple}
              onCheckedChange={(v) => setEditData(d => ({ ...d, is_couple: v }))}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Hide my city</p>
              <p className="text-[11px] text-muted-foreground">Others see how far away you are, not your city name</p>
            </div>
            <Switch
              checked={!!editData.hide_city}
              onCheckedChange={(v) => setEditData(d => ({ ...d, hide_city: v }))}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bio" className="text-xs text-muted-foreground">Bio</label>
            <Textarea
              id="bio"
              value={editData.bio || ''}
              onChange={(e) => setEditData(d => ({ ...d, bio: e.target.value }))}
              placeholder="Say something seductive..."
              maxLength={500}
              className="bg-secondary border-border/50 resize-none"
              rows={3}
            />
            <p className="text-[11px] text-muted-foreground text-right">{(editData.bio || '').length}/500</p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !!usernameError}
            className="w-full h-11 bg-gradient-to-r from-primary to-accent text-white font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </section>

        {/* Photos */}
        <section className="space-y-3">
          <h4 className="text-[11px] font-medium text-gold/80 uppercase tracking-[0.2em]">Photos</h4>
          <div className="grid grid-cols-2 gap-2">
            {(editData.photos || []).map((photo, idx) => (
              <div key={idx} className="relative rounded-2xl overflow-hidden aspect-square bg-secondary">
                <button
                  onClick={() => setViewerIndex(idx)}
                  className="w-full h-full"
                  aria-label="View photo full screen"
                >
                  <SecureImage src={photo.url} alt="" className="w-full h-full object-cover" />
                </button>
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                <button
                  onClick={() => toggleNsfw(idx)}
                  className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    photo.is_nsfw ? 'bg-accent text-white' : 'bg-black/60 text-white'
                  }`}
                >
                  {photo.is_nsfw ? '🔥 NSFW' : 'SFW'}
                </button>
              </div>
            ))}
            {(editData.photos || []).length < 4 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-gold/50 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add photo</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </section>

        {viewerIndex !== null && (
          <PhotoViewer
            // Your own photos are never blurred for you
            photos={(editData.photos || []).map(p => ({ ...p, is_nsfw: false }))}
            startIndex={viewerIndex}
            onClose={() => setViewerIndex(null)}
          />
        )}

        {/* Sexuality */}
        <section className="space-y-2">
          <h4 className="text-[11px] font-medium text-gold/80 uppercase tracking-[0.2em]">Sexuality</h4>
          <div className="flex gap-2 flex-wrap">
            {orientationOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setEditData(d => ({ ...d, orientation: opt.value }))}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  editData.orientation === opt.value
                    ? 'bg-gradient-to-r from-primary to-accent border-transparent text-white'
                    : 'bg-secondary border-border/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Interests */}
        <section className="space-y-2">
          <h4 className="text-[11px] font-medium text-gold/80 uppercase tracking-[0.2em]">Interests</h4>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(tag => {
              const active = (editData.interests || []).includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                    active
                      ? 'bg-primary/20 border-gold/50 text-gold'
                      : 'bg-secondary border-border/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </section>

        {/* Prompts */}
        <section className="space-y-3">
          <h4 className="text-[11px] font-medium text-gold/80 uppercase tracking-[0.2em]">Prompts</h4>
          {[
            { key: 'prompt1', label: 'My typical Sunday looks like...' },
            { key: 'prompt2', label: 'Biggest turn-on...' },
            { key: 'prompt3', label: 'Perfect night would be...' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <Input
                value={editData[key] || ''}
                onChange={(e) => setEditData(d => ({ ...d, [key]: e.target.value }))}
                className="bg-secondary border-border/50 mt-1"
              />
            </div>
          ))}
        </section>

        {/* Age toggle */}
        <section>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary border border-border/50">
            <div className="flex items-center gap-2">
              {editData.show_age ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">Show age</p>
                <p className="text-xs text-muted-foreground">Display your age on your profile</p>
              </div>
            </div>
            <Switch checked={!!editData.show_age} onCheckedChange={(v) => setEditData(d => ({ ...d, show_age: v }))} />
          </div>
        </section>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={saving || !!usernameError}
          className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white font-semibold"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}