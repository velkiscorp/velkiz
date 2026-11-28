import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io as ioClient } from 'socket.io-client';
import { useAuth } from '@/lib/AuthContext';
import { getAccessToken } from '@/api/client';
import { callsApi } from '@/api/calls';
import { useMatches } from '@/api/queries';
import { useToast } from '@/components/ui/use-toast';
import IncomingCall from '@/components/call/IncomingCall';
import CallScreen from '@/components/call/CallScreen';
import ReportDialog from '@/components/safety/ReportDialog';
import { playRingtone, stopRingtone } from '@/lib/ringtone';

// Voice and video calls between matches.
//
// Ringing and hanging up come through the app's socket; sound and video go
// through LiveKit, so nobody ever learns the other person's IP address.
// Screenshots and screen recordings of a call come out black, because the
// whole app sits behind the iPhone's secure capture shield (SceneDelegate).

const CallContext = createContext(null);

const ENDED_TEXT = {
  declined: "They're not available right now",
  missed: 'No answer',
  busy: "They're on another call",
};

export function CallProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: matchesData } = useMatches();
  const { data: config } = useQuery({
    queryKey: ['callsConfig'],
    queryFn: () => callsApi.config(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const enabled = !!config?.enabled;

  // status: idle | incoming | outgoing | connecting | active
  const [status, setStatus] = useState('idle');
  const [call, setCall] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState('user');
  const [remoteVideo, setRemoteVideo] = useState(null);
  const [localVideo, setLocalVideo] = useState(null);
  const [remoteCameraOn, setRemoteCameraOn] = useState(false);
  const [answeredAt, setAnsweredAt] = useState(null);
  const [reporting, setReporting] = useState(null);

  const roomRef = useRef(null);
  const callRef = useRef(null);
  callRef.current = call;

  const partnerFor = useCallback((matchId) => {
    const match = matchesData?.matches?.find(m => m.id === matchId);
    return {
      userId: match?.matchedWith?.id,
      username: match?.matchedWith?.username,
      photoUrl: match?.matchedWith?.photos?.[0]?.url,
    };
  }, [matchesData]);

  const cleanup = useCallback(() => {
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      room.removeAllListeners();
      room.disconnect().catch(() => {});
    }
    document.querySelectorAll('[data-velkiz-call]').forEach(el => el.remove());
    setCall(null);
    setStatus('idle');
    setMuted(false);
    setCameraOn(false);
    setFacing('user');
    setRemoteVideo(null);
    setLocalVideo(null);
    setRemoteCameraOn(false);
    setAnsweredAt(null);
  }, []);

  const hangUp = useCallback(() => {
    const current = callRef.current;
    if (current) callsApi.end(current.id).catch(() => {});
    cleanup();
  }, [cleanup]);

  // Join the LiveKit room and turn on the mic (and camera for video calls)
  const connect = useCallback(async ({ url, token, video }) => {
    const { Room, RoomEvent, Track, VideoPresets } = await import('livekit-client');
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      // Clearer sound: mono voice at up to 64 kbps (LiveKit's default is 48),
      // with echo, noise and level handled by the phone
      audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      // Sharper video: 720p at 30 fps, up to 2.5 Mbps when the connection allows
      videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
      publishDefaults: {
        audioPreset: { maxBitrate: 64_000 },
        dtx: true,
        red: true,
        videoEncoding: { maxBitrate: 2_500_000, maxFramerate: 30 },
        simulcast: true,
      },
    });
    roomRef.current = room;

    const refreshRemote = () => {
      const other = [...room.remoteParticipants.values()][0];
      const pub = other?.getTrackPublication(Track.Source.Camera);
      const track = pub?.isSubscribed && !pub.isMuted ? pub.videoTrack : null;
      setRemoteVideo(track || null);
      setRemoteCameraOn(!!track);
    };
    const refreshLocal = () => {
      const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
      const track = pub && !pub.isMuted ? pub.videoTrack : null;
      setLocalVideo(track || null);
      setCameraOn(!!track);
    };

    room
      .on(RoomEvent.ParticipantConnected, () => {
        setStatus('active');
        setAnsweredAt(a => a || Date.now());
      })
      .on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          // Their voice plays through a hidden <audio>
          const el = track.attach();
          el.dataset.velkizCall = '1';
          el.style.display = 'none';
          document.body.appendChild(el);
        }
        refreshRemote();
      })
      .on(RoomEvent.TrackUnsubscribed, (track) => { track.detach().forEach(el => el.remove()); refreshRemote(); })
      .on(RoomEvent.TrackMuted, () => { refreshRemote(); refreshLocal(); })
      .on(RoomEvent.TrackUnmuted, () => { refreshRemote(); refreshLocal(); })
      .on(RoomEvent.LocalTrackPublished, refreshLocal)
      .on(RoomEvent.LocalTrackUnpublished, refreshLocal)
      // The other person left: the call is over
      .on(RoomEvent.ParticipantDisconnected, () => { if (roomRef.current === room) hangUp(); })
      .on(RoomEvent.Disconnected, () => { if (roomRef.current === room) hangUp(); });

    await room.connect(url, token);
    if (roomRef.current !== room) { room.disconnect(); return; }
    // Started from a tap, so the browser lets their audio play
    await room.startAudio().catch(() => {});
    await room.localParticipant.setMicrophoneEnabled(true);
    if (video) {
      await room.localParticipant.setCameraEnabled(true, { facingMode: 'user' }).catch(() => {});
    }
    refreshLocal();
    if (room.remoteParticipants.size > 0) {
      setStatus('active');
      setAnsweredAt(a => a || Date.now());
      refreshRemote();
    }
  }, [hangUp]);

  const failed = useCallback((err, fallback) => {
    cleanup();
    const permission = err?.name === 'NotAllowedError';
    toast({
      variant: 'destructive',
      title: permission ? 'Velkiz needs your microphone' : fallback,
      description: permission
        ? 'Turn on Microphone (and Camera for video) for Velkiz in iPhone Settings.'
        : err?.error || 'Please try again.',
    });
  }, [cleanup, toast]);

  const startCall = useCallback(async (matchId, video) => {
    if (callRef.current) return;
    setStatus('outgoing');
    try {
      const result = await callsApi.start(matchId, video);
      setCall(result.call);
      callRef.current = result.call;
      await connect({ ...result, video });
    } catch (err) {
      if (callRef.current) callsApi.end(callRef.current.id).catch(() => {});
      failed(err, "Couldn't start the call");
    }
  }, [connect, failed]);

  const accept = useCallback(async () => {
    const current = callRef.current;
    if (!current) return;
    setStatus('connecting');
    try {
      const result = await callsApi.accept(current.id);
      setCall(result.call);
      await connect({ ...result, video: current.video });
    } catch (err) {
      callsApi.end(current.id).catch(() => {});
      failed(err, "Couldn't answer the call");
    }
  }, [connect, failed]);

  const decline = useCallback(() => {
    const current = callRef.current;
    if (current) callsApi.decline(current.id).catch(() => {});
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !muted;
    await room.localParticipant.setMicrophoneEnabled(!next).catch(() => {});
    setMuted(next);
  }, [muted]);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setCameraEnabled(!cameraOn, { facingMode: facing }).catch(() => {});
  }, [cameraOn, facing]);

  const flipCamera = useCallback(async () => {
    const track = localVideo;
    if (!track) return;
    const next = facing === 'user' ? 'environment' : 'user';
    try {
      await track.restartTrack({ facingMode: next });
      setFacing(next);
    } catch {}
  }, [localVideo, facing]);

  // Hang up, then open the report form for this person
  const reportFromCall = useCallback(() => {
    const current = callRef.current;
    if (!current) return;
    const partner = partnerFor(current.matchId);
    hangUp();
    setReporting({ matchId: current.matchId, ...partner });
  }, [hangUp, partnerFor]);

  // App-wide socket: lets a call ring wherever you are in the app
  useEffect(() => {
    if (!user?.id || !enabled) return;
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const socket = ioClient(socketUrl, {
      auth: (cb) => { getAccessToken().then(token => cb({ token })); },
    });

    socket.on('call_incoming', (incoming) => {
      // Already on a call: the server won't normally ring us, but just in case
      if (callRef.current) return;
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setCall(incoming);
      callRef.current = incoming;
      setStatus('incoming');
    });

    socket.on('call_accepted', (accepted) => {
      if (callRef.current?.id !== accepted.id) return;
      setCall(accepted);
      setStatus('active');
      setAnsweredAt(a => a || Date.now());
    });

    // Answered on another phone signed in as you
    socket.on('call_answered_elsewhere', ({ callId }) => {
      if (callRef.current?.id === callId && !roomRef.current) cleanup();
    });

    socket.on('call_ended', ({ callId, reason }) => {
      if (callRef.current?.id !== callId) return;
      const wasCaller = callRef.current.callerId === user.id;
      cleanup();
      if (wasCaller && ENDED_TEXT[reason]) toast({ title: ENDED_TEXT[reason] });
    });

    return () => { socket.disconnect(); };
  }, [user?.id, enabled, queryClient, cleanup, toast]);

  // Ring while a call is coming in; ringback while waiting for them to answer
  useEffect(() => {
    if (status === 'incoming') playRingtone('incoming');
    else if (status === 'outgoing') playRingtone('outgoing');
    else stopRingtone();
  }, [status]);
  useEffect(() => stopRingtone, []);

  // Signing out hangs up
  useEffect(() => { if (!user?.id) cleanup(); }, [user?.id, cleanup]);

  const partner = call ? partnerFor(call.matchId) : null;

  const value = {
    enabled,
    inCall: status !== 'idle',
    startCall,
  };

  return (
    <CallContext.Provider value={value}>
      {children}

      {status === 'incoming' && call && (
        <IncomingCall partner={partner} video={call.video} onAccept={accept} onDecline={decline} />
      )}

      {['outgoing', 'connecting', 'active'].includes(status) && (
        <CallScreen
          status={status}
          video={!!call?.video}
          partner={partner}
          answeredAt={answeredAt}
          muted={muted}
          cameraOn={cameraOn}
          remoteVideo={remoteVideo}
          remoteCameraOn={remoteCameraOn}
          localVideo={localVideo}
          mirrored={facing === 'user'}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onFlip={flipCamera}
          onHangUp={hangUp}
          onReport={reportFromCall}
        />
      )}

      <ReportDialog
        open={!!reporting}
        onOpenChange={(o) => { if (!o) setReporting(null); }}
        userId={reporting?.userId}
        username={reporting?.username}
        matchId={reporting?.matchId}
        onDone={({ blocked }) => {
          if (!blocked) return;
          queryClient.invalidateQueries({ queryKey: ['matches'] });
          if (window.location.pathname === '/Chat') navigate('/Messages');
        }}
      />
    </CallContext.Provider>
  );
}

export const useCalls = () => useContext(CallContext) || { enabled: false, inCall: false, startCall: () => {} };
