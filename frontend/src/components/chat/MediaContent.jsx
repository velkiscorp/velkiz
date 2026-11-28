import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, ImageOff } from 'lucide-react';
import { useChatMedia, formatSeconds } from '@/lib/chatMedia';
import PhotoViewer from '@/components/shared/PhotoViewer';

// The inside of a photo, video or voice message bubble
export default function MediaContent({ message, isMine }) {
  const { src, failed } = useChatMedia(message.match_id, message.id);

  if (failed) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-card/70 text-xs text-muted-foreground">
        <ImageOff className="w-4 h-4" />
        Couldn't load this {message.kind === 'audio' ? 'voice message' : message.kind}
      </div>
    );
  }
  if (message.kind === 'audio') return <VoiceMessage src={src} duration={message.media_duration} isMine={isMine} />;
  if (message.kind === 'video') return <VideoMessage src={src} />;
  return <PhotoMessage src={src} />;
}

const noSave = { WebkitTouchCallout: 'none' };

function PhotoMessage({ src }) {
  const [open, setOpen] = useState(false);
  if (!src) return <div className="w-56 h-64 rounded-xl bg-secondary animate-pulse" />;
  return (
    <>
      <img
        src={src}
        alt="Photo"
        draggable={false}
        onClick={() => setOpen(true)}
        onContextMenu={(e) => e.preventDefault()}
        style={noSave}
        className="max-w-[240px] max-h-[320px] rounded-xl object-cover border border-border/50"
      />
      {open && <PhotoViewer photos={[{ url: src }]} onClose={() => setOpen(false)} />}
    </>
  );
}

function VideoMessage({ src }) {
  if (!src) return <div className="w-56 h-72 rounded-xl bg-secondary animate-pulse" />;
  return (
    <video
      src={src}
      controls
      playsInline
      preload="metadata"
      controlsList="nodownload"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
      style={noSave}
      className="max-w-[240px] max-h-[360px] rounded-xl bg-black border border-border/50"
    />
  );
}

function VoiceMessage({ src, duration, isMine }) {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(duration || 0);

  useEffect(() => {
    if (!src) return;
    const a = new Audio(src);
    audio.current = a;
    a.onloadedmetadata = () => { if (Number.isFinite(a.duration)) setLength(a.duration); };
    a.ontimeupdate = () => setTime(a.currentTime);
    a.onended = () => { setPlaying(false); setTime(0); };
    a.onpause = () => setPlaying(false);
    a.onplay = () => setPlaying(true);
    return () => { a.pause(); audio.current = null; };
  }, [src]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  const progress = length ? Math.min(1, time / length) : 0;

  return (
    <div className={`flex items-center gap-3 w-56 px-3 py-2.5 rounded-md ${
      isMine ? 'bg-gradient-to-b from-primary to-accent text-primary-foreground rounded-br-none' : 'bg-card/70 border-l-2 border-gold/60'
    }`}>
      <button
        onClick={toggle}
        disabled={!src}
        aria-label={playing ? 'Pause' : 'Play voice message'}
        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${isMine ? 'bg-white/20' : 'bg-gold/20 text-gold'} disabled:opacity-50`}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`h-1 rounded-full ${isMine ? 'bg-white/25' : 'bg-white/10'}`}>
          <div className={`h-1 rounded-full ${isMine ? 'bg-white' : 'bg-gold'}`} style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="text-[11px] mt-1 tabular-nums opacity-80">{formatSeconds(playing || time ? time : length)}</p>
      </div>
    </div>
  );
}
