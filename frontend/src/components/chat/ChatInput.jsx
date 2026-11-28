import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, Reply } from 'lucide-react';

// replyingTo: the message being answered (shown above the box), or null
export default function ChatInput({ onSend, replyingTo, onCancelReply }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

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
      <div className="flex items-center gap-1.5 p-3">
        <Input
          ref={inputRef}
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          enterKeyHint="send"
          className="flex-1 h-10 bg-black/30 border border-border rounded-full px-4 focus-visible:ring-gold/50"
        />
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
      </div>
    </div>
  );
}
