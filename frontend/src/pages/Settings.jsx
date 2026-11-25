import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Bell, Eye, Trash2, LogOut, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { authApi } from '@/api/auth';
import { queryClientInstance } from '@/lib/query-client';
import { useAuth } from '@/lib/AuthContext';
import { getMatchAnimationsEnabled, setMatchAnimationsEnabled } from '@/lib/preferences';

const SETTINGS_ROWS = [
  { icon: Shield, label: 'Privacy & Safety', desc: 'Blocking, reporting, data' },
  { icon: Bell, label: 'Notifications', desc: 'Match alerts, messages' },
  { icon: Eye, label: 'Who can see me', desc: 'Visibility settings' },
  { icon: Trash2, label: 'Delete Account', desc: 'Permanently remove your profile', danger: true, action: 'delete' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [matchAnimations, setMatchAnimations] = useState(getMatchAnimationsEnabled());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 h-14 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      <div className="p-4 space-y-3 max-w-lg mx-auto w-full">
        {SETTINGS_ROWS.map(({ icon: Icon, label, desc, danger, action }) => (
          <button
            key={label}
            onClick={action === 'delete' ? openDelete : undefined}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 hover:bg-secondary/50 transition-colors text-left ${danger ? 'border-destructive/30' : ''}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-destructive/10' : 'bg-secondary'}`}>
              <Icon className={`w-5 h-5 ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${danger ? 'text-destructive' : ''}`}>{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
        ))}

        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Match Animations</p>
              <p className="text-xs text-muted-foreground">
                {matchAnimations ? 'Full celebration when you match' : 'Simple notification instead'}
              </p>
            </div>
          </div>
          <Switch checked={matchAnimations} onCheckedChange={handleToggleMatchAnimations} />
        </div>

        <div className="pt-4">
          <Button
            variant="ghost"
            className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 pt-2">Velkis v1.0 · by Velvet · Anonymous by design</p>
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