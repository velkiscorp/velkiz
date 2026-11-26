import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Ban, BookOpen, Trash2, LogOut, ChevronRight, Sparkles, PauseCircle,
  MapPinOff, Cake, LifeBuoy, FileText, Lock,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { authApi } from '@/api/auth';
import { profilesApi } from '@/api/profiles';
import { useMyProfile, useRefresh } from '@/api/queries';
import { queryClientInstance } from '@/lib/query-client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getMatchAnimationsEnabled, setMatchAnimationsEnabled } from '@/lib/preferences';
import { LEGAL } from '@/lib/legal';

const Section = ({ title, children }) => (
  <div className="space-y-2">
    <p className="px-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">{title}</p>
    <div className="rounded-2xl bg-card border border-border/50 divide-y divide-border/40 overflow-hidden">{children}</div>
  </div>
);

const RowIcon = ({ icon: Icon, danger }) => (
  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-destructive/10' : 'bg-secondary'}`}>
    <Icon className={`w-[18px] h-[18px] ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />
  </div>
);

const LinkRow = ({ icon, label, desc, onClick, danger }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-3.5 hover:bg-secondary/50 transition-colors text-left">
    <RowIcon icon={icon} danger={danger} />
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${danger ? 'text-destructive' : ''}`}>{label}</p>
      {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
  </button>
);

const ToggleRow = ({ icon, label, desc, checked, onChange, disabled }) => (
  <div className="flex items-center gap-3 p-3.5">
    <RowIcon icon={icon} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{label}</p>
      {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const refresh = useRefresh();
  const { data: myProfileData } = useMyProfile();
  const profile = myProfileData?.profile;

  const [matchAnimations, setMatchAnimations] = useState(getMatchAnimationsEnabled());
  const [saving, setSaving] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Visibility switches save straight to the profile
  const saveProfileSetting = async (field, value) => {
    setSaving(field);
    try {
      await profilesApi.updateMyProfile({ [field]: value });
      await refresh.myProfile();
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't save that", description: err?.error || 'Please try again.' });
    } finally {
      setSaving(null);
    }
  };

  const openDelete = () => {
    setPassword('');
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!password || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await authApi.deleteAccount(password);
      queryClientInstance.clear();
      window.location.replace('/login?deleted=1');
    } catch (err) {
      setDeleteError(err?.error || "Couldn't delete your account. Please try again.");
      setDeleting(false);
    }
  };

  const handleToggleMatchAnimations = (enabled) => {
    setMatchAnimations(enabled);
    setMatchAnimationsEnabled(enabled);
  };

  const paused = profile?.is_active === false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 h-14 box-content pt-safe flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      <div className="p-4 pb-10 space-y-6 max-w-lg mx-auto w-full">
        <Section title="Who can see me">
          <ToggleRow
            icon={PauseCircle}
            label="Pause my profile"
            desc={paused ? "Hidden from Discover. Your matches and chats carry on." : "Take a break without deleting anything"}
            checked={paused}
            disabled={!profile || saving === 'is_active'}
            onChange={(v) => saveProfileSetting('is_active', !v)}
          />
          <ToggleRow
            icon={MapPinOff}
            label="Hide my city"
            desc="Others see your country and distance only"
            checked={!!profile?.hide_city}
            disabled={!profile || saving === 'hide_city'}
            onChange={(v) => saveProfileSetting('hide_city', v)}
          />
          <ToggleRow
            icon={Cake}
            label="Show my age"
            desc="Your date of birth is never shown"
            checked={profile ? profile.show_age !== false : true}
            disabled={!profile || saving === 'show_age'}
            onChange={(v) => saveProfileSetting('show_age', v)}
          />
        </Section>

        <Section title="Safety">
          <LinkRow icon={Ban} label="Blocked people" desc="See and unblock people you blocked" onClick={() => navigate('/Settings/blocked')} />
          <LinkRow icon={BookOpen} label="Community Guidelines" desc="How we keep Velkiz safe" onClick={() => navigate('/guidelines')} />
        </Section>

        <Section title="App">
          <ToggleRow
            icon={Sparkles}
            label="Match animations"
            desc={matchAnimations ? 'Full celebration when you match' : 'Simple notification instead'}
            checked={matchAnimations}
            onChange={handleToggleMatchAnimations}
          />
        </Section>

        <Section title="Help and legal">
          <LinkRow icon={LifeBuoy} label="Contact support" desc={LEGAL.supportEmail} onClick={() => { window.location.href = `mailto:${LEGAL.supportEmail}?subject=Velkiz%20support`; }} />
          <LinkRow icon={Lock} label="Privacy Policy" onClick={() => navigate('/privacy')} />
          <LinkRow icon={FileText} label="Terms of Service" onClick={() => navigate('/terms')} />
        </Section>

        <Section title="Account">
          <LinkRow icon={LogOut} label="Sign out" onClick={logout} />
          <LinkRow icon={Trash2} label="Delete account" desc="Permanently remove your profile and data" onClick={openDelete} danger />
        </Section>

        <p className="text-center text-xs text-muted-foreground/40">Velkiz v1.0 · Anonymous by design</p>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={(o) => { if (!deleting) setDeleteOpen(o); }}>
        <AlertDialogContent>
          <form onSubmit={handleDelete} className="space-y-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes your profile, photos, matches, chats and login.
                It can't be undone. Enter your password to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-secondary border-border/50"
              autoFocus
            />
            {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={deleting}>Cancel</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={!password || deleting}>
                {deleting ? 'Deleting...' : 'Delete forever'}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}