import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from 'lucide-react';

export default function ChatInput({ onSend }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    await onSend(text.trim());
    setText('');
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl pb-safe">
      <div className="flex items-center gap-1.5 p-3">
        <Input
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-10 bg-black/30 border border-border rounded-full px-4 focus-visible:ring-gold/50"
        />
        <Button
          size="icon"
          disabled={!text.trim() || sending}
          onClick={handleSend}
          className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-b from-primary to-accent shadow-[0_0_20px_hsl(346_75%_36%/0.5)]"
        >
          <Send className="w-4 h-4 text-white" />
        </Button>
      </div>
    </div>
  );
}