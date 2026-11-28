import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import EmptyState, { emptyCtaClass } from '@/components/shared/EmptyState';
import FeedCard from '../components/discover/FeedCard';
import MatchModal from '../components/discover/MatchModal';
import MatchBanner from '../components/discover/MatchBanner';
import DiscoverFilters from '../components/discover/DiscoverFilters';
import ProfileViewModal from '../components/profile/ProfileViewModal';
import SuperLikeSheet from '../components/discover/SuperLikeSheet';
import SuperLikeComposer from '../components/discover/SuperLikeComposer';
import SuperLikeBurst from '../components/discover/SuperLikeBurst';
import FilterPanel from '../components/discover/FilterPanel';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { profilesApi } from '@/api/profiles';
import { swipesApi } from '@/api/swipes';
import { getMatchAnimationsEnabled } from '@/lib/preferences';
import { useMyProfile, useRefresh, useSuperLikes } from '@/api/queries';
import { loadFilters, saveFilters, toQueryParams } from '@/lib/discoverFilters';
import { geocodeCity } from '@/lib/geocode';

const PAGE_SIZE = 20;
// Load the next batch once only this many people are left below
const LOW_WATER = 5;
// At the end of the feed, look for newly joined people this often
const EMPTY_POLL_MS = 60_000;
// After a like, move on to the next person after this long
const ADVANCE_MS = 650;

// Discover is a vertical feed, one person per screen, like Reels.
// Scroll down to move on (that counts as a pass), swipe sideways for their
// photos and details, tap the heart (or double-tap a photo) to like.
// You can scroll back up and like someone you passed.
export default function Discover() {
  const [items, setItems] = useState([]);
  // id -> 'left' | 'right' | 'super' for people decided on this visit
  const [decisions, setDecisions] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [index, setIndex] = useState(0);
  const [matchPopup, setMatchPopup] = useState(null);
  const [filters, setFilters] = useState(loadFilters);
  const [panelOpen, setPanelOpen] = useState(false);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [superSheetOpen, setSuperSheetOpen] = useState(false);
  const [composeFor, setComposeFor] = useState(null);
  const [burst, setBurst] = useState(false);
  const { data: superLikes } = useSuperLikes();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const { user } = useAuth();
  const { toast } = useToast();

  const feedRef = useRef(null);
  const seenIds = useRef(new Set());
  const generation = useRef(0);
  const fetching = useRef(false);
  const filteredOut = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const decisionsRef = useRef(decisions);
  decisionsRef.current = decisions;
  const indexRef = useRef(0);

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
      // The server leaves out everyone already decided on (and people who
      // Super Liked you, who come separately), so its list now starts with
      // the people loaded here but not decided yet.
      const pending = itemsRef.current.filter(p => !p.superLikedYou && !decisionsRef.current[p.id]).length;
      const offset = pending + filteredOut.current;
      const result = await profilesApi.getProfiles({
        filters: toQueryParams(filters),
        limit: PAGE_SIZE,
        offset,
      });
      if (gen !== generation.current) return;
      const supers = (result?.superLikers || []).filter(p => !seenIds.current.has(p.id));
      const fresh = (result?.profiles || []).filter(p => !seenIds.current.has(p.id));
      [...supers, ...fresh].forEach(p => seenIds.current.add(p.id));
      filteredOut.current += result?.filteredOut || 0;
      setItems(prev => {
        // People who Super Liked you go right after where you are now
        if (!supers.length) return [...prev, ...fresh];
        const at = Math.min(prev.length, indexRef.current + (prev.length ? 1 : 0));
        return [...prev.slice(0, at), ...supers, ...prev.slice(at), ...fresh];
      });
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

  const resetFeed = useCallback(() => {
    generation.current += 1;
    fetching.current = false;
    seenIds.current = new Set();
    filteredOut.current = 0;
    itemsRef.current = [];
    decisionsRef.current = {};
    indexRef.current = 0;
    setItems([]);
    setDecisions({});
    setIndex(0);
    setHasMore(true);
    setIsLoading(true);
    feedRef.current?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (canLoad) loadMore();
  }, [canLoad, loadMore]);

  // Top up before running out
  useEffect(() => {
    if (canLoad && hasMore && !isLoading && items.length - index < LOW_WATER) loadMore();
  }, [canLoad, hasMore, isLoading, items.length, index, loadMore]);

  // At the end, check now and then for people who joined since
  const atEnd = !isLoading && index >= items.length;
  useEffect(() => {
    if (!canLoad || !atEnd) return;
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
  }, [canLoad, atEnd, loadMore]);

  const setDecision = (id, d) => {
    decisionsRef.current = { ...decisionsRef.current, [id]: d };
    setDecisions(decisionsRef.current);
  };
  const clearDecision = (id) => {
    const next = { ...decisionsRef.current };
    delete next[id];
    decisionsRef.current = next;
    setDecisions(next);
  };

  const scrollToIndex = (i) => {
    const el = feedRef.current;
    if (el) el.scrollTo({ top: i * el.clientHeight, behavior: 'smooth' });
  };

  // Scrolling past someone without liking them is a pass
  const pass = useCallback(async (profile) => {
    if (!profile || decisionsRef.current[profile.id]) return;
    setDecision(profile.id, 'left');
    try {
      await swipesApi.swipe(profile.id, 'left');
    } catch (err) {
      if (err?.error === 'Already swiped this user') return;
      // Not recorded: they'll simply show up again another time
      clearDecision(profile.id);
    }
  }, []);

  const onFeedScroll = () => {
    const el = feedRef.current;
    if (!el || !el.clientHeight) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i === indexRef.current) return;
    if (i > indexRef.current) pass(itemsRef.current[indexRef.current]);
    indexRef.current = i;
    setIndex(i);
  };

  // Like or Super Like. A pass from earlier is taken back first.
  const decide = async (profile, direction, message) => {
    if (!profile || busyId) return;
    const before = decisionsRef.current[profile.id];
    if (before === 'right' || before === 'super') return;
    setBusyId(profile.id);
    setDecision(profile.id, direction);
    try {
      if (before === 'left') await swipesApi.undo(profile.id).catch(() => {});
      const result = await swipesApi.swipe(profile.id, direction, message);
      if (direction === 'super') refresh.superLikes();
      if (result.matched) {
        setMatchPopup(result.match);
        refresh.matchesAndLikes();
      } else {
        // Move on to the next person, like a reel
        const i = itemsRef.current.findIndex(p => p.id === profile.id);
        if (i === indexRef.current) setTimeout(() => scrollToIndex(i + 1), ADVANCE_MS);
      }
    } catch (err) {
      if (before) setDecision(profile.id, before); else clearDecision(profile.id);
      if (err?.code === 'NO_SUPER_LIKES') {
        refresh.superLikes();
        setSuperSheetOpen(true);
        return;
      }
      if (err?.error === 'User not found') {
        removeProfile(profile.id);
        return;
      }
      toast({ title: "That didn't go through", description: err?.error || 'Please try again.', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const startSuper = (profile) => {
    if (superLikes && superLikes.total < 1) { setSuperSheetOpen(true); return; }
    setComposeFor(profile);
  };

  const sendSuper = (message) => {
    const profile = composeFor;
    setComposeFor(null);
    setBurst(true);
    decide(profile, 'super', message);
  };

  const removeProfile = (id) => {
    setItems(prev => prev.filter(p => p.id !== id));
  };

  // Blocked from the profile sheet: gone for good
  const handleBlocked = (profile) => {
    setPreviewProfile(null);
    removeProfile(profile.id);
    toast({ title: `${profile.username || 'They'} won't appear again` });
  };

  const handleFilterChange = (next) => {
    setPanelOpen(false);
    if (JSON.stringify(next) === JSON.stringify(filters)) return;
    saveFilters(next);
    resetFeed();
    setFilters(next);
  };

  const handleRefresh = () => {
    resetFeed();
    loadMore();
  };

  return (
    <div className="h-app flex flex-col gap-2 pt-3 px-4 pb-3">
      <DiscoverFilters filters={filters} onChange={handleFilterChange} onOpenPanel={() => setPanelOpen(true)} />

      <div className="flex-1 min-h-0 relative mt-2">
        {isLoading ? (
          <div className="w-full h-full rounded-md bg-secondary animate-pulse" />
        ) : (
          <div
            ref={feedRef}
            onScroll={onFeedScroll}
            className="absolute inset-0 overflow-y-auto snap-y snap-mandatory no-scrollbar overscroll-contain rounded-md"
          >
            {items.map((profile, i) => (
              <div key={profile.id} className="h-full snap-start snap-always pb-2">
                {Math.abs(i - index) <= 2 ? (
                  <FeedCard
                    profile={profile}
                    decision={decisions[profile.id]}
                    busy={busyId === profile.id}
                    superLeft={superLikes?.total}
                    onLike={() => decide(profile, 'right')}
                    onSuper={() => startSuper(profile)}
                    onInfo={() => setPreviewProfile(profile)}
                  />
                ) : (
                  <div className="w-full h-full rounded-md bg-card" />
                )}
              </div>
            ))}
            <div className="h-full snap-start snap-always">
              {isFetching && hasMore ? (
                <div className="w-full h-full rounded-md bg-secondary animate-pulse" />
              ) : (
                <EmptyState
                  drawing="moon"
                  title={items.length ? "That's everyone for now" : 'The night is quiet, for now'}
                  className="h-full"
                  action={
                    <button className={emptyCtaClass} onClick={handleRefresh} disabled={isFetching}>
                      <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  }
                >
                  New people arrive all the time. Try another filter or check back later.
                </EmptyState>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {composeFor && (
          <SuperLikeComposer
            profile={composeFor}
            remaining={superLikes?.total}
            onSend={sendSuper}
            onClose={() => setComposeFor(null)}
          />
        )}
      </AnimatePresence>

      {burst && <SuperLikeBurst onDone={() => setBurst(false)} />}

      <AnimatePresence>
        {superSheetOpen && <SuperLikeSheet onClose={() => setSuperSheetOpen(false)} />}
      </AnimatePresence>

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
          onLike={() => { const p = previewProfile; setPreviewProfile(null); decide(p, 'right'); }}
          onSuper={() => { const p = previewProfile; setPreviewProfile(null); startSuper(p); }}
          onBlocked={() => handleBlocked(previewProfile)}
        />
      )}
    </div>
  );
}
