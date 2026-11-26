import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { io as ioClient } from 'socket.io-client';
import { ArrowLeft, Shield, MoreVertical, LogOut, Ban, Flag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import ChatBubble from '../components/chat/ChatBubble';
import EmptyState from '@/components/shared/EmptyState';
import ChatInput from '../components/chat/ChatInput';
import { useAuth } from '@/lib/AuthContext';
import { messagesApi } from '@/api/messages';
import { matchesApi } from '@/api/matches';
import { profilesApi } from '@/api/profiles';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import ProfileViewModal from '@/components/profile/ProfileViewModal';
import ReportDialog from '@/components/safety/ReportDialog';
import { useToast } from '@/components/ui/use-toast';
import { getAccessToken } from '@/api/client';
import { useMatches, useChatMessages, queryKeys } from '@/api/queries';

export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('matchId');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: messagesData = {} } = useChatMessages(matchId, {
    // Socket handles real-time delivery - this is just a fallback in case
    // the socket connection drops
    refetchInterval: 15000,
  });

  const messages = messagesData?.messages || [];

  // Real-time: join this match's room and append pushed messages as they arrive
  useEffect(() => {
    if (!matchId || !user?.id) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    // auth as a function: every (re)connect asks Supabase for a fresh token,
    // so the chat keeps working after the 1-hour token expiry
    const socket = ioClient(socketUrl, {
      auth: (cb) => { getAccessToken().then(token => cb({ token })); },
    });

    socket.on('connect', () => {
      socket.emit('join_match', matchId);
    });

    socket.on('receive_message', (message) => {
      if (message.match_id !== matchId) return;
      queryClient.setQueryData(queryKeys.chatMessages(matchId), (old) => {
        const existing = old?.messages || [];
        if (existing.some(m => m.id === message.id)) return old;
        return {
          ...old,
          messages: [...existing, { ...message, isMine: message.sender_id === user.id }],
        };
      });
    });

    // The other person left or blocked: this chat is gone
    socket.on('match_ended', (payload) => {
      if (payload?.matchId !== matchId) return;
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      navigate('/Messages', { replace: true });
    });

    socket.on('join_error', (err) => {
      console.error('Chat socket join error:', err);
    });

    return () => {
      socket.disconnect();
    };
  }, [matchId, user?.id, queryClient, navigate]);

  const { data: matchesData = {} } = useMatches();

  // Find the current match from the matches list
  const match = matchesData?.matches?.find(m => m.id === matchId);
  const partnerUsername = match?.matchedWith?.username;
  const partnerPhoto = match?.matchedWith?.photos?.[0]?.url;
  const partnerUserId = match?.matchedWith?.id;

  const [viewingProfile, setViewingProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const handleViewProfile = async () => {
    if (!partnerUserId || isLoadingProfile) return;
    setIsLoadingProfile(true);
    try {
      const result = await profilesApi.getProfileById(partnerUserId);
      setViewingProfile(result.profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [reportOpen, setReportOpen] = useState(false);

  // Blocked from the profile sheet or by reporting: this chat is closed now
  const leaveAfterBlock = () => {
    queryClient.invalidateQueries({ queryKey: ['matches'] });
    navigate('/Messages');
  };

  const leaveOrBlockMutation = useMutation({
    mutationFn: async (action) => {
      if (action === 'leave') {
        await matchesApi.unmatch(matchId);
      } else if (action === 'block') {
        await matchesApi.blockUser(matchId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      navigate('/Messages');
    },
    onError: (error, action) => {
      console.error(`Failed to ${action} chat:`, error);
      toast({
        variant: 'destructive',
        title: action === 'block' ? "Couldn't block" : "Couldn't leave chat",
        description: 'Something went wrong. Please try again.',
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (content) => messagesApi.sendMessage(matchId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(matchId) });
    },
  });

  const handleSend = async (content) => {
    if (!content?.trim()) return;
    sendMutation.mutate(content);
  };

  return (
    <div className="h-dvh-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 h-16 box-content pt-safe flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <button
          onClick={handleViewProfile}
          disabled={isLoadingProfile}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <ProfileAvatar
            photoUrl={partnerPhoto}
            username={partnerUsername}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-gold/60 animate-gold-glow shrink-0"
            textClassName="text-base"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-serif italic text-lg leading-tight truncate text-gold">{partnerUsername || 'Anonymous'}</h3>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Shield className="w-3 h-3" />
              Anonymous and private
            </div>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem
              onClick={() => leaveOrBlockMutation.mutate('leave')}
              className="gap-2 text-muted-foreground"
            >
              <LogOut className="w-4 h-4" />
              Leave chat
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setReportOpen(true)}
              disabled={!partnerUserId}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Flag className="w-4 h-4" />
              Report
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => leaveOrBlockMutation.mutate('block')}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Ban className="w-4 h-4" />
              Block person
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <EmptyState drawing="letter" title="Say something they'll remember" className="h-full">
            Only the two of you can read this. Names stay hidden until you share them.
          </EmptyState>
        )}
        {messages.map(msg => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isMine={msg.isMine}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSend} />

      {viewingProfile && (
        <ProfileViewModal
          profile={viewingProfile}
          onClose={() => setViewingProfile(null)}
          matchId={matchId}
          onBlocked={leaveAfterBlock}
        />
      )}

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        userId={partnerUserId}
        username={partnerUsername}
        matchId={matchId}
        onDone={({ blocked }) => { if (blocked) leaveAfterBlock(); }}
      />
    </div>
  );
}