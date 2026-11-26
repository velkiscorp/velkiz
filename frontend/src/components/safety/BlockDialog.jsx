import React, { useState } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { safetyApi } from '@/api/safety';

// Confirm, then block. onBlocked() runs once the block is saved.
export default function BlockDialog({ open, onOpenChange, userId, username, onBlocked }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await safetyApi.block(userId);
      onOpenChange(false);
      onBlocked?.();
    } catch (err) {
      setError(err?.error || "Couldn't block. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!busy) { setError(null); onOpenChange(o); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block {username || 'this person'}?</AlertDialogTitle>
          <AlertDialogDescription>
            You won't see each other anywhere on Velkiz, and any chat between you closes.
            They aren't told. You can unblock from Settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={busy}>Cancel</AlertDialogCancel>
          <Button type="button" variant="destructive" disabled={busy} onClick={confirm}>
            {busy ? 'Blocking...' : 'Block'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
