import React, { useState } from 'react';
import { Check } from 'lucide-react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { safetyApi, REPORT_REASONS } from '@/api/safety';

// Report someone. Blocks them too unless the switch is turned off.
// onDone({ blocked }) runs after the report is sent.
export default function ReportDialog({ open, onOpenChange, userId, username, matchId, onDone }) {
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(null);

  const reset = () => { setReason(null); setDetails(''); setAlsoBlock(true); setError(null); setSent(null); };

  const close = (o) => {
    if (sending) return;
    if (!o) {
      if (sent) onDone?.(sent);
      reset();
    }
    onOpenChange(o);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!reason || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await safetyApi.report({ userId, reason, details: details.trim(), matchId, alsoBlock });
      setSent({ blocked: !!res?.blocked });
    } catch (err) {
      setError(err?.error || "Couldn't send the report. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={close}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
        {sent ? (
          <div className="space-y-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Thanks for telling us</AlertDialogTitle>
              <AlertDialogDescription>
                We review every report, usually within 24 hours. {username || 'They'} won't
                know it was you.{sent.blocked ? ` You won't see each other on Velkiz any more.` : ''}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button type="button" onClick={() => close(false)}>Done</Button>
            </AlertDialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Report {username || 'this person'}</AlertDialogTitle>
              <AlertDialogDescription>What's wrong? Your report is anonymous.</AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-1.5">
              {REPORT_REASONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm text-left transition-colors ${
                    reason === r.value ? 'border-gold/60 bg-gold/10 text-foreground' : 'border-border/50 bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {r.label}
                  {reason === r.value && <Check className="w-4 h-4 text-gold" />}
                </button>
              ))}
            </div>

            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
              placeholder="Anything else we should know? (optional)"
              className="bg-secondary border-border/50 min-h-[80px]"
            />

            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Also block {username || 'them'}</span>
              <Switch checked={alsoBlock} onCheckedChange={setAlsoBlock} />
            </label>

            <p className="text-xs text-muted-foreground">
              If you're in danger, contact your local emergency services first.
            </p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={sending}>Cancel</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={!reason || sending}>
                {sending ? 'Sending...' : 'Send report'}
              </Button>
            </AlertDialogFooter>
          </form>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
