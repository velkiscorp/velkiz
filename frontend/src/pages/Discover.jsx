import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { X, Heart, Star, Undo2, Clock, RefreshCw } from 'lucide-react';
import EmptyState, { emptyCtaClass } from '@/components/shared/EmptyState';
import { Button } from "@/components/ui/button";
import SwipeCard from '../components/discover/SwipeCard';
import MatchModal from '../components/discover/MatchModal';
import MatchBanner from '../components/discover/MatchBanner';
import DiscoverFilters from '../components/discover/DiscoverFilters';
import ProfileViewModal from '../components/profile/ProfileViewModal';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { profilesApi } from '@/api/profiles';
import { swipesApi } from '@/api/swipes';
import { getMatchAnimationsEnabled } from '@/lib/preferences';
import { useMyProfile, useRefresh } from '@/api/queries';
import FilterPanel from '../components/discover/FilterPanel';
import { loadFilters, saveFilters, toQueryParams } from '@/lib/discoverFilters';
import { geocodeCity } from '@/lib/geocode';

const PAGE_SIZE = 20;
// Load the next batch once only this many cards are left
const LOW_WATER = 5;
// When the deck is empty, look for newly joined people this often
const EMPTY_POLL_MS = 60_000;

export default function Discover() {
  // The cards still to decide on, top card first. Swiped cards are removed
  // from here locally instead of refetching the whole list.
  const [deck, setDeck] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [matchPopup, setMatchPopup] = useState(null);
  // Last action that can be undone: { type: 'swipe' | 'skip', profile, matched }
  const [lastAction, setLastAction] = useState(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [animDir, setAnimDir] = useState(null);
  const [filters, setFilters] = useState(loadFilters);
  const [panelOpen, setPanelOpen] = useState(false);
  const [previewProfile, setPreviewProfile] = useState(null);
  const navigate = useNavigate();
  const refresh = useRefresh();
  const { user } = useAuth();
  const { toast } = useToast();

  // Profiles skipped with "decide later" this visit. The server still returns
  // them (nothing was recorded), so they're hidden here and counted in the offset.
  const skippedIds = useRef(new Set());
  // Every id loaded for the current filter, to drop duplicates between pages
  const seenIds = useRef(new Set());
  // Bumped on filter change / refresh so late responses for the old deck are ignored
  const generation = useRef(0);
  const fetching = useRef(false);
  // Profiles the server skipped for being outside your distance (see loadMore)
  const filteredOut = useRef(0);
  const deckRef = useRef(deck);
  deckRef.current = deck;

  const { data: myProfileData } = useMyProfile();

  const myProfile = myProfileData?.profile;
  const canLoad = !!user?.id && !!myProfile?.onboarding_complete;
  const hasLocation = myProfile?.location_lat != null && myProfile?.location_lng != null;

  // Accounts made before the distance filter have a city but no coordinates:
  // look the city up once and save its centre, so distance works for them too
  const geocodeTried = useRef(false);
  useEffect(() => {
    if (!myProfile?.city || hasLocation || geocodeTried.current) return;
    geocodeTried.current = true;
    geocodeCity(myProfile.city, myProfile.country).then(async (pos) => {
      if (!pos) return;
      try {
        await profilesApi.updateMyProfile({ location_lat: pos.lat, location_lng: pos.lng });
        refresh.myProfile();
      } catch { /* not important enough to bother anyone */ }
    });
  }, [myProfile?.city, myProfile?.country, hasLocation, refresh]);

  useEffect(() => {
    if (myProfile !== undefined && myProfile?.onboarding_complete === false) {
      navigate('/Onboarding');
    }
  }, [myProfile, navigate]);

  const loadMore = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    setIsFetching(true);
    const gen = generation.current;
    try {
      // The server leaves out everyone already swiped, so the profiles it would
      // still return before the next page are exactly the ones loaded but not
      // swiped yet: the cards in the deck plus the ones skipped for later.
      // Plus the ones the server skipped for being outside your distance:
      // they're still in its list, just not shown.
      const offset = deckRef.current.length + skippedIds.current.size + filteredOut.current;
      const result = await profilesApi.getProfiles({
        filters: toQueryParams(filters),
        limit: PAGE_SIZE,
        offset,
      });
      if (gen !== generation.current) return;
      const fresh = (result?.profiles || []).filter(p => !seenIds.current.has(p.id));
      fresh.forEach(p => seenIds.current.add(p.id));
      filteredOut.current += result?.filteredOut || 0;
      setDeck(prev => [...prev, ...fresh]);
      setHasMore(!!result?.hasMore);
    } catch {
      if (gen !== generation.current) return;
      toast({ title: "Couldn't load profiles", description: 'Check your connection and try again.', variant: 'destructive' });
      setHasMore(false);
    } finally {
      if (gen === generation.current) {
        fetching.current = false;
        setIsFetching(false);
        setIsLoading(false);
      }
    }
  }, [filters, toast]);

  // Start a fresh deck. keepSkipped=false lets "decide later" people come back.
  const resetDeck = useCallback(({ keepSkipped = false } = {}) => {
    generation.current += 1;
    fetching.current = false;
    if (!keepSkipped) skippedIds.current = new Set();
    seenIds.current = new Set(skippedIds.current);
    filteredOut.current = 0;
    deckRef.current = [];
    setDeck([]);
    setHasMore(true);
    setIsLoading(true);
    setLastAction(null);
  }, []);

  // First load, and a new deck whenever the filter changes
  useEffect(() => {
    if (canLoad) loadMore();
  }, [canLoad, loadMore]);

  // Top up before running out, so the next card is always ready
  useEffect(() => {
    if (canLoad && hasMore && !isLoading && deck.length < LOW_WATER) loadMore();
  }, [canLoad, hasMore, isLoading, deck.length, loadMore]);

  // With nothing left, check now and then (and when the app regains focus)
  // for people who joined since, so they show up without a reload
  const deckEmpty = !isLoading && deck.length === 0;
  useEffect(() => {
    if (!canLoad || !deckEmpty) return;
    const check = () => { if (!fetching.current) loadMore(); };
    const timer = setInterval(check, EMPTY_POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [canLoad, deckEmpty, loadMore]);

  const swipeMutation = useMutation({
    mutationFn: ({ profile, direction }) => swipesApi.swipe(profile.id, direction),
    onSuccess: (result, { profile }) => {
      setDeck(prev => prev.filter(p => p.id !== profile.id));
      setLastAction({ type: 'swipe', profile, matched: !!result.matched });
      setAnimDir(null);
      if (result.matched) {
        setMatchPopup(result.match);
        refresh.matchesAndLikes();
      }
    },
    onError: (err, { profile }) => {
      setAnimDir(null);
      // Already swiped (e.g. on another device) or no longer available
      // (blocked / deleted): nothing to decide, so just drop the card
      if (err?.error === 'Already swiped this user' || err?.error === 'User not found') {
        setDeck(prev => prev.filter(p => p.id !== profile.id));
        return;
      }
      // Swipe wasn't recorded: the card stays put instead of silently vanishing
      toast({ title: "Swipe didn't go through", description: err?.error || 'Please try again.', variant: 'destructive' });
    },
  });

  const handleSwipe = (direction) => {
    const profile = deck[0];
    if (!profile || swipeMutation.isPending || isUndoing) return;
    setAnimDir(direction);
    swipeMutation.mutate({ profile, direction });
  };

  const handleSkip = () => {
    const profile = deck[0];
    if (!profile || swipeMutation.isPending || isUndoing) return;
    setAnimDir('skip');
    // Intentionally no API call and nothing recorded - unlike a real swipe,
    // this profile isn't excluded server-side, so it naturally reappears
    // next time Discover is loaded fresh (reload, reopening the app, Refresh)
    setTimeout(() => {
      skippedIds.current.add(profile.id);
      setDeck(prev => prev.filter(p => p.id !== profile.id));
      setLastAction({ type: 'skip', profile });
      setAnimDir(null);
    }, 250);
  };

  // Blocked from the profile sheet: drop them from the deck for good
  const handleBlocked = (profile) => {
    setPreviewProfile(null);
    skippedIds.current.delete(profile.id);
    setDeck(prev => prev.filter(p => p.id !== profile.id));
    if (lastAction?.profile?.id === profile.id) setLastAction(null);
    toast({ title: `${profile.username || 'They'} won't appear again` });
  };

  const handleUndo = async () => {
    if (!lastAction || isUndoing || swipeMutation.isPending) return;
    const { type, profile } = lastAction;
    const gen = generation.current;

    if (type === 'swipe') {
      setIsUndoing(true);
      try {
        await swipesApi.undo(profile.id);
      } catch (err) {
        toast({ title: "Couldn't undo", description: err?.error || 'Please try again.', variant: 'destructive' });
        setIsUndoing(false);
        return;
      }
      setIsUndoing(false);
    } else {
      skippedIds.current.delete(profile.id);
    }

    if (gen !== generation.current) return;
    setDeck(prev => [profile, ...prev.filter(p => p.id !== profile.id)]);
    setLastAction(null);
  };

  const handleFilterChange = (next) => {
    setPanelOpen(false);
    if (JSON.stringify(next) === JSON.stringify(filters)) return;
    saveFilters(next);
    resetDeck();
    setFilters(next);
  };

  const handleRefresh = () => {
    resetDeck();
    loadMore();
  };

  const visibleProfiles = deck.slice(0, 3);
  const hasProfiles = visibleProfiles.length > 0;
  // A swipe that made a match can't be undone (the server refuses), so don't offer it
  const canUndo = !!lastAction && !lastAction.matched && !isUndoing && !swipeMutation.isPending;

  return (
    <div className="h-app flex flex-col gap-2 pt-3 px-4">
      <DiscoverFilters filters={filters} onChange={handleFilterChange} onOpenPanel={() => setPanelOpen(true)} />

      <div className="flex-1 relative">
        {isLoading ? (
          <div className="w-full h-full rounded-md bg-secondary animate-pulse" />
        ) : hasProfiles ? (
          <AnimatePresence>
            {[...visibleProfiles].reverse().map((profile, reversedIdx) => {
              const stackIdx = visibleProfiles.length - 1 - reversedIdx;
              const isTop = stackIdx === 0;
              const scale = 1 - stackIdx * 0.04;
              const translateY = stackIdx * 10;
              return (
                <div
                  key={profile.id}
                  className="absolute inset-0"
                  style={{
                    transform: `scale(${scale}) translateY(${translateY}px)`,
                    zIndex: isTop ? 10 : 10 - stackIdx,
                    transformOrigin: 'center bottom',
                  }}
                >
                  <SwipeCard
                    profile={profile}
                    isTop={isTop}
                    swipeDir={isTop ? animDir : null}
                    onSwipe={handleSwipe}
                    onTapInfo={isTop ? () => setPreviewProfile(profile) : undefined}
                  />
                </div>
              );
            })}
          </AnimatePresence>
        ) : (
          <EmptyState
            drawing="moon"
            title="The night is quiet, for now"
            className="h-full"
            action={
              <>
                <button className={emptyCtaClass} onClick={handleRefresh} disabled={isFetching}>
                  <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                {lastAction && !lastAction.matched && (
                  <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={handleUndo} disabled={!canUndo}>
                    <Undo2 className="w-4 h-4 mr-2" />
                    Undo last
                  </Button>
                )}
              </>
            }
          >
            {skippedIds.current.size > 0
              ? 'Refresh to see the people you skipped, or try another filter.'
              : 'New people arrive all the time. Try another filter or check back later.'}
          </EmptyState>
        )}
      </div>

      {hasProfiles && (
        <div className="flex items-center justify-center gap-3 py-2">
          <Button size="lg" variant="outline" className="w-12 h-12 rounded-full border-border/50 hover:bg-secondary" onClick={handleUndo} disabled={!canUndo} title="Undo last">
            <Undo2 className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button size="lg" variant="outline" className="w-12 h-12 rounded-full border-border/50 hover:bg-secondary" onClick={handleSkip} disabled={swipeMutation.isPending || isUndoing} title="Not sure yet - decide later">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button size="lg" variant="outline" className="w-16 h-16 rounded-full border border-white/25 bg-black/30 hover:bg-white/5" onClick={() => handleSwipe('left')} disabled={swipeMutation.isPending || isUndoing}>
            <X className="w-7 h-7 text-foreground/70" />
          </Button>
          <Button size="lg" className="w-20 h-20 rounded-full bg-gradient-to-b from-primary to-accent border border-gold/30 shadow-lg animate-pulse-glow" onClick={() => handleSwipe('right')} disabled={swipeMutation.isPending || isUndoing}>
            <Heart className="w-8 h-8 text-primary-foreground" fill="currentColor" />
          </Button>
          <Button size="lg" variant="outline" className="w-16 h-16 rounded-full border border-gold/50 bg-black/30 hover:bg-gold/10" onClick={() => handleSwipe('super')} disabled={swipeMutation.isPending || isUndoing}>
            <Star className="w-7 h-7 text-gold" fill="currentColor" />
          </Button>
        </div>
      )}

      <AnimatePresence>
        {matchPopup && (
          getMatchAnimationsEnabled() ? (
            <MatchModal
              match={matchPopup}
              myProfile={myProfile}
              onChat={() => { setMatchPopup(null); navigate('/Messages'); }}
              onClose={() => setMatchPopup(null)}
            />
          ) : (
            <MatchBanner
              match={matchPopup}
              onChat={() => { setMatchPopup(null); navigate('/Messages'); }}
              onDismiss={() => setMatchPopup(null)}
            />
          )
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panelOpen && (
          <FilterPanel
            filters={filters}
            hasLocation={hasLocation}
            onApply={handleFilterChange}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </AnimatePresence>

      {previewProfile && (
        <ProfileViewModal
          profile={previewProfile}
          onClose={() => setPreviewProfile(null)}
          onLike={() => { setPreviewProfile(null); handleSwipe('right'); }}
          onSuper={() => { setPreviewProfile(null); handleSwipe('super'); }}
          onBlocked={() => handleBlocked(previewProfile)}
        />
      )}
    </div>
  );
}
