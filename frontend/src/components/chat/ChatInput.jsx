import React, { useEffect, useRef, useState } from 'react';
import { startVoiceRecording, formatSeconds, MAX_VOICE_SECONDS } from '@/lib/chatMedia';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, Reply, Plus, Mic, Trash2 } from 'lucide-react';

// replyingTo: the message being answered (shown above the box), or null
// onSendMedia(file, { duration }): a photo or video picked, or a voice message recorded
// sendingMedia: true while a file uploads
export default function ChatInput({ onSend, onSendMedia, sendingMedia, replyingTo, onCancelReply, onError }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const recording = useRef(null);
  const [recordingSince, setRecordingSince] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!recordingSince) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [recordingSince]);

  const startRecording = async () => {
    try {
      recording.current = await startVoiceRecording();
      setRecordingSince(recording.current.startedAt);
      setNow(Date.now());
    } catch (err) {
      onError?.(err?.name === 'NotAllowedError'
        ? 'Turn on Microphone for Velkiz in iPhone Settings to send voice messages.'
        : "Couldn't start recording.");
    }
  };

  const stopRecording = async (send) => {
    const r = recording.current;
    recording.current = null;
    setRecordingSince(null);
    if (!r) return;
    if (!send) { r.cancel(); return; }
    const { blob, duration } = await r.stop();
    if (duration < 0.7 || !blob.size) return;
    onSendMedia?.(blob, { duration });
  };

  // Stop at the time limit
  const elapsed = recordingSince ? (now - recordingSince) / 1000 : 0;
  useEffect(() => {
    if (recordingSince && elapsed >= MAX_VOICE_SECONDS) stopRecording(true);
  });

  // Leaving the chat mid-recording throws it away
  useEffect(() => () => recording.current?.cancel(), []);

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onSendMedia?.(file);
  };

  // Picking a message to reply to opens the keyboard
  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
    // Keep the keyboard up for the next message
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl pb-safe">
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 pt-2.5 text-xs">
          <Reply className="w-3.5 h-3.5 text-gold shrink-0" />
          <div className="flex-1 min-w-0 border-l-2 border-gold/60 pl-2">
            <p className="text-gold/80 font-medium">Replying to {replyingTo.isMine ? 'yourself' : 'them'}</p>
            <p className="text-muted-foreground truncate">{replyingTo.content}</p>
          </div>
          <button
            onPointerDown={(e) => e.preventDefault()}
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="p-1 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {sendingMedia && (
        <p className="px-4 pt-2 text-[11px] text-muted-foreground animate-pulse">Sending…</p>
      )}
      {recordingSince ? (
        <div className="flex items-center gap-3 p-3">
          <button onClick={() => stopRecording(false)} aria-label="Delete recording" className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground">
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-2 h-10 px-4 rounded-full bg-black/30 border border-border">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-sm tabular-nums">{formatSeconds(elapsed)}</span>
            <span className="text-xs text-muted-foreground ml-auto">max {formatSeconds(MAX_VOICE_SECONDS)}</span>
          </div>
          <Button
            size="icon"
            onClick={() => stopRecording(true)}
            aria-label="Send voice message"
            className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-b from-primary to-accent"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      ) : (
      <div className="flex items-center gap-1.5 p-3">
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={pickFile} />
        {onSendMedia && (
          <button
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            disabled={sendingMedia}
            aria-label="Send a photo or video"
            className="shrink-0 w-9 h-10 flex items-center justify-center text-gold disabled:opacity-40"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
        <Input
          ref={inputRef}
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          enterKeyHint="send"
          className="flex-1 h-10 bg-black/30 border border-border rounded-full px-4 focus-visible:ring-gold/50"
        />
        {!text.trim() && onSendMedia ? (
          <Button
            size="icon"
            onClick={startRecording}
            disabled={sendingMedia}
            aria-label="Record a voice message"
            className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-b from-primary to-accent shadow-[0_0_20px_hsl(346_75%_36%/0.5)]"
          >
            <Mic className="w-4 h-4 text-white" />
          </Button>
        ) : (
        <Button
          size="icon"
          disabled={!text.trim()}
          // Tapping send must not take focus from the text box, or iOS
          // closes the keyboard after every message
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSend}
          className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-b from-primary to-accent shadow-[0_0_20px_hsl(346_75%_36%/0.5)]"
        >
          <Send className="w-4 h-4 text-white" />
        </Button>
        )}
      </div>
      )}
    </div>
  );
}
