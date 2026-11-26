import React, { useState } from 'react';
import { Flag, Ban } from 'lucide-react';
import ReportDialog from './ReportDialog';
import BlockDialog from './BlockDialog';

// "Report" and "Block" links for the bottom of a profile.
// onBlocked runs when the person ends up blocked (directly or by reporting).
export default function SafetyActions({ userId, username, matchId, onBlocked, className = '' }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  if (!userId) return null;

  return (
    <>
      <div className={`flex items-center justify-center gap-6 text-xs text-muted-foreground ${className}`}>
        <button type="button" onClick={() => setReportOpen(true)} className="flex items-center gap-1.5 hover:text-destructive transition-colors py-2">
          <Flag className="w-3.5 h-3.5" /> Report
        </button>
        <button type="button" onClick={() => setBlockOpen(true)} className="flex items-center gap-1.5 hover:text-destructive transition-colors py-2">
          <Ban className="w-3.5 h-3.5" /> Block
        </button>
      </div>
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        userId={userId}
        username={username}
        matchId={matchId}
        onDone={({ blocked }) => { if (blocked) onBlocked?.(); }}
      />
      <BlockDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        userId={userId}
        username={username}
        onBlocked={onBlocked}
      />
    </>
  );
}
