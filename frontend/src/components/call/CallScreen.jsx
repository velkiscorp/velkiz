import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, SwitchCamera, Flag, ShieldCheck } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';

// Shows a LiveKit video track in a <video>
function TrackVideo({ track, className, mirrored }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!track || !el) return;
    track.attach(el);
    return () => { track.detach(el); };
  }, [track]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className={className}
      style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
    />
  );
}

const useElapsed = (since) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!since) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [since]);
  if (!since) return null;
  const secs = Math.max(0, Math.floor((now - since) / 1000));
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
};

function RoundButton({ onClick, label, active = true, danger, children }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        aria-label={label}
        className={`w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform [&_svg]:size-6 ${
          danger
            ? 'bg-destructive text-destructive-foreground'
            : active
              ? 'bg-white/15 text-white backdrop-blur-md'
              : 'bg-white text-black'
        }`}
      >
        {children}
      </button>
      <span className="text-[10px] text-white/70">{label}</span>
    </div>
  );
}

export default function CallScreen({
  status, video, partner, answeredAt, muted, cameraOn, remoteVideo, remoteCameraOn, localVideo, mirrored,
  onToggleMute, onToggleCamera, onFlip, onHangUp, onReport,
}) {
  const elapsed = useElapsed(status === 'active' ? answeredAt : null);
  const name = partner?.username || 'Your match';
  const statusText = status === 'outgoing' ? 'Ringing…' : status === 'connecting' ? 'Connecting…' : elapsed || 'Connected';
  const showRemote = status === 'active' && remoteCameraOn && remoteVideo;

  return (
    <div className="fixed inset-0 z-[90] bg-black text-white flex flex-col select-none" role="dialog" aria-label={`Call with ${name}`}>
      {/* Their video, or their photo */}
      {showRemote ? (
        <TrackVideo track={remoteVideo} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[hsl(346_40%_12%)] to-black">
          <ProfileAvatar
            photoUrl={partner?.photoUrl}
            username={partner?.username}
            className="w-32 h-32 rounded-full object-cover ring-2 ring-gold/60"
            textClassName="text-4xl"
          />
          {status === 'active' && video && <p className="text-xs text-white/60">Their camera is off</p>}
        </div>
      )}

      {/* Top: name, timer, report */}
      <div className="relative z-10 pt-safe bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-start justify-between px-4 pt-3 pb-6">
          <div className="min-w-0">
            <h2 className="font-serif italic text-2xl text-gold truncate">{name}</h2>
            <p className="text-sm text-white/80 tabular-nums">{statusText}</p>
          </div>
          <button
            onClick={onReport}
            className="flex items-center gap-1.5 text-xs text-white/80 bg-white/10 rounded-full px-3 py-1.5 backdrop-blur-md shrink-0"
          >
            <Flag className="w-3.5 h-3.5" />
            Report
          </button>
        </div>
      </div>

      {/* My camera, small in the corner */}
      {localVideo && cameraOn && (
        <div className="absolute z-10 right-4 top-[calc(env(safe-area-inset-top)+5.5rem)] w-28 h-40 rounded-xl overflow-hidden ring-1 ring-white/20 shadow-xl bg-black">
          <TrackVideo track={localVideo} mirrored={mirrored} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex-1" />

      {/* Controls */}
      <div className="relative z-10 pb-safe bg-gradient-to-t from-black/80 to-transparent">
        <p className="flex items-center justify-center gap-1.5 text-[10px] text-white/50 pt-6 pb-3 px-6 text-center">
          <ShieldCheck className="w-3 h-3 shrink-0" />
          Private call. Screenshots and screen recordings come out black.
        </p>
        <div className="flex items-start justify-center gap-5 pb-8">
          <RoundButton onClick={onToggleMute} label={muted ? 'Unmute' : 'Mute'} active={!muted}>
            {muted ? <MicOff /> : <Mic />}
          </RoundButton>
          {video && (
            <RoundButton onClick={onToggleCamera} label={cameraOn ? 'Camera off' : 'Camera on'} active={cameraOn}>
              {cameraOn ? <Video /> : <VideoOff />}
            </RoundButton>
          )}
          {video && cameraOn && (
            <RoundButton onClick={onFlip} label="Flip">
              <SwitchCamera />
            </RoundButton>
          )}
          <RoundButton onClick={onHangUp} label="End" danger>
            <PhoneOff />
          </RoundButton>
        </div>
      </div>
    </div>
  );
}
