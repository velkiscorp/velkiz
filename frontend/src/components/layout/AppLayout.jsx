import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { OuroborosIcon, HeartArrowIcon, ScrollSealIcon, LionIcon, TigressIcon } from '../icons/EmberIcons';
import VelvetLogo from '../icons/VelvetLogo';
import { useMyProfile, useLikes, useMatches } from '@/api/queries';
import PushPrompt from '@/components/shared/PushPrompt';
import { onScreenshot } from '@/lib/native';
import { useToast } from '@/components/ui/use-toast';

// Block screenshots / screen recording globally
if (typeof document !== 'undefined') {
  document.addEventListener('keyup', (e) => {
    if (e.key === 'PrintScreen') {
      navigator.clipboard?.writeText('').catch(() => {});
    }
  });
}

export default function AppLayout() {
  const location = useLocation();

  const { data: myProfile } = useMyProfile();
  const { toast } = useToast();

  // iPhone app: screenshots come out blank, so say why
  useEffect(() => onScreenshot(() => {
    toast({ title: 'Screenshots are blocked in Velkiz', description: "To protect everyone's privacy." });
  }), [toast]);

  const { data: likesData } = useLikes({ refetchInterval: 10000 });

  const { data: matchesData } = useMatches({ refetchInterval: 10000 });

  const likesCount = likesData?.likes?.length || 0;
  const likesDisplay = likesCount > 99 ? '99+' : likesCount > 0 ? String(likesCount) : null;

  const unreadCount = matchesData?.matches?.filter(m => m.hasUnread).length || 0;
  const unreadDisplay = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  const gender = myProfile?.profile?.gender;
  const ProfileIcon = (gender === 'female') ? TigressIcon : LionIcon;

  const NAV_ITEMS = [
    { path: '/Discover', Icon: OuroborosIcon, label: 'Discover', badge: null },
    { path: '/Matches', Icon: HeartArrowIcon, label: 'Likes', badge: likesDisplay },
    { path: '/Messages', Icon: ScrollSealIcon, label: 'Messages', badge: unreadDisplay },
    { path: '/MyProfile', Icon: ProfileIcon, label: 'Profile', badge: null },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col select-none" style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 pt-safe backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/Discover" className="flex items-center">
            <VelvetLogo className="w-10 h-10" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      {myProfile?.profile?.onboarding_complete && <PushPrompt />}

      {/* Bottom Nav */}
      <nav className="sticky bottom-0 z-50 pb-safe backdrop-blur-xl bg-background/80 border-t border-border/50">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-around">
          {NAV_ITEMS.map(({ path, Icon, label, badge }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 relative ${
                 isActive ? 'text-gold' : 'text-gold/45 hover:text-gold/80'
               }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_10px_hsl(37_45%_74%/0.6)]' : ''}`} />
                  {badge && (
                    <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold ring-2 ring-background flex items-center justify-center px-1 leading-none">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium uppercase tracking-[0.15em]">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}