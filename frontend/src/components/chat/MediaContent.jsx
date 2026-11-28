import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, ImageOff, Eye, EyeOff, X } from 'lucide-react';
import { useChatMedia, formatSeconds } from '@/lib/chatMedia';
import { messagesApi } from '@/api/messages';
import PhotoViewer from '@/components/shared/PhotoViewer';

// The inside of a photo, video or voice message bubble
export default function MediaContent({ message, isMine }) {
  if (message.view_once && message.kind !== 'audio') return <ViewOnce message={message} isMine={isMine} />;
  return <SavedMedia message={message} isMine={isMine} />;
}

function SavedMedia({ message, isMine }) {
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

// A view-once photo or video: the other person taps to open it full screen,
// one time. The file is deleted on the server as it's handed over, so
// closing it (or the video ending) is the last anyone sees of it.
function ViewOnce({ message, isMine }) {
  const [openedHere, setOpenedHere] = useState(false);
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const what = message.kind === 'video' ? 'video' : 'photo';
  const opened = !!message.viewed_at || openedHere;

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  const open = async () => {
    if (loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const blob = await messagesApi.getMedia(message.match_id, message.id);
      setOpenedHere(true);
      setSrc(URL.createObjectURL(blob));
    } catch (err) {
      if (err?.code === 'VIEWED') setOpenedHere(true);
      else setFailed(true);
    } finally {
      setLoading(false);
    }
  };
  const close = () => setSrc(null);

  // A blurred, full-size card: the tiny preview stretched and blurred, so
  // there's a hint of colour and some anticipation, nothing more
  const canOpen = !isMine && !opened;
  const label = opened ? 'Opened' : isMine ? 'One-time view' : loading ? 'Opening…' : failed ? "Couldn't open. Tap to try again" : 'One-time view';
  const body = (
    <button
      onClick={canOpen ? open : undefined}
      disabled={!canOpen || loading}
      aria-label={canOpen ? `Open one-time ${what}` : `One-time ${what}, ${opened ? 'opened' : 'not opened yet'}`}
      className="relative w-56 h-72 rounded-xl overflow-hidden border border-border/50 bg-gradient-to-br from-primary/40 via-card to-black text-left"
    >
      {message.media_preview && !opened && (
        <img
          src={message.media_preview}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl"
        />
      )}
      <span className={`absolute inset-0 ${opened ? 'bg-black/70' : 'bg-black/25'}`} />
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white px-4 text-center">
        <span className={`w-12 h-12 rounded-full flex items-center justify-center ${opened ? 'bg-white/10' : 'bg-primary/90 shadow-[0_0_20px_hsl(346_75%_36%/0.6)]'}`}>
          {opened ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </span>
        <span className="text-sm font-medium drop-shadow">{label}</span>
        {!opened && (
          <span className="text-[11px] text-white/75 drop-shadow">
            {isMine ? 'They can open it once' : `Tap to view ${what}`}
          </span>
        )}
      </span>
      {message.kind === 'video' && (
        <span className="absolute bottom-2.5 left-2.5 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white">
          <Play className="w-4 h-4 ml-0.5" />
        </span>
      )}
    </button>
  );

  return (
    <>
      {body}
      {src && createPortal(
        <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center pt-safe pb-safe" onContextMenu={(e) => e.preventDefault()}>
          <button onClick={close} aria-label="Close" className="absolute top-0 right-0 p-4 text-white/80 z-10" style={{ marginTop: 'env(safe-area-inset-top)' }}>
            <X className="w-7 h-7" />
          </button>
          {message.kind === 'video' ? (
            <video
              src={src}
              autoPlay
              playsInline
              controls
              controlsList="nodownload"
              disablePictureInPicture
              onEnded={close}
              style={noSave}
              className="max-w-full max-h-full"
            />
          ) : (
            <img src={src} alt="Photo" draggable={false} onClick={close} style={noSave} className="max-w-full max-h-full object-contain" />
          )}
          <p className="absolute bottom-0 inset-x-0 pb-6 text-center text-[11px] text-white/60" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
            Opens once. Gone when you close it.
          </p>
        </div>,
        document.body
      )}
    </>
  );
}
