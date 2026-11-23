"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  PlusCircle,
  MessageSquare,
  User,
} from "lucide-react";
import { useBadges } from "@/hooks/useBadges";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getBadgeForRank, parseRankFromMembership } from "@/lib/badges";

interface BottomNavProps {
  initialUser?: any;
}

const renderGradientLabel = (label: string) => {
  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-emerald-500 to-teal-500 font-black">
      {label}
    </span>
  );
};

const BottomNav: React.FC<BottomNavProps> = () => {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { unreadChatsCount, pendingRequestsCount, totalUnreadMessages } = useBadges();
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [mounted, setMounted] = useState(false);
  const [optimisticActiveId, setOptimisticActiveId] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userRank = currentUser?.joinRank || parseRankFromMembership(currentUser?.membershipNumber);
  const userBadge = getBadgeForRank(userRank);

  // Determine active item from pathname
  const isHome = pathname === "/";
  const isDiscover = pathname.startsWith("/discover");
  const isCreate =
    pathname.startsWith("/activities/create") ||
    pathname.startsWith("/travel/create") ||
    pathname.startsWith("/create");
  const isChats = pathname.startsWith("/chats") || pathname.startsWith("/requests");
  const isProfile =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/safety") ||
    pathname.startsWith("/admin");

  const resolvedActiveId = isHome
    ? "home"
    : isDiscover
      ? "discover"
      : isCreate
        ? "create"
        : isChats
          ? "chats"
          : isProfile
            ? "profile"
            : "home";

  // Prioritize optimistic click state for 0ms instant feedback
  const activeId = optimisticActiveId || resolvedActiveId;

  // Clear optimistic state when route transition completes
  useEffect(() => {
    setOptimisticActiveId(null);
  }, [pathname]);

  const updatePill = useCallback(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (activeEl) {
      setPillStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1,
      });
    }
  }, []);

  useEffect(() => {
    // Immediate synchronous positioning on active change
    updatePill();
    // Fast RAF pass for layout settling
    rafIdRef.current = requestAnimationFrame(updatePill);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [activeId, updatePill]);

  // 1. NEVER render bottom dock when not logged in
  if (!currentUser) return null;

  // 2. NEVER render on auth/onboarding pages
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname?.startsWith("/onboarding")
  ) {
    return null;
  }

  // 3. Never render floating dock inside an active private chat room (needs full space for keyboard & input)
  if (pathname?.startsWith("/chats/") && pathname !== "/chats") {
    return null;
  }

  // 4. Never render dock inside emergency live tracking views
  if (pathname?.startsWith("/safety/live")) {
    return null;
  }

  const combinedChatsBadge = (totalUnreadMessages > 0 ? totalUnreadMessages : unreadChatsCount) + pendingRequestsCount;
  const chatsBadgeDisplay =
    mounted && combinedChatsBadge > 0
      ? combinedChatsBadge > 9
        ? "9+"
        : combinedChatsBadge
      : null;

  const navItems = [
    {
      id: "home",
      label: t.home || "Home",
      href: "/",
      icon: Home,
      badge: 0,
      badgeColor: "bg-emerald-500",
    },
    {
      id: "discover",
      label: t.discover,
      href: "/discover",
      icon: Compass,
      badge: 0,
      badgeColor: "bg-emerald-500",
    },
    {
      id: "create",
      label: t.create,
      href: "/activities/create",
      icon: PlusCircle,
      badge: 0,
      badgeColor: "bg-emerald-500",
    },
    {
      id: "chats",
      label: t.chats,
      href: "/chats",
      icon: MessageSquare,
      badge: chatsBadgeDisplay,
      badgeColor: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-900 border border-emerald-300/80 shadow-xs",
    },
    {
      id: "profile",
      label: t.profile,
      href: "/profile",
      icon: User,
      isProfile: true,
      badge: 0,
      badgeColor: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-900 border border-emerald-300/80 shadow-xs",
    },
  ];

  return (
    <>

      {/* Floating Bottom Navigation Dock */}
      <nav
        className="md:hidden fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-2.5 right-2.5 sm:left-1/2 sm:-translate-x-1/2 sm:w-[460px] z-50 pointer-events-none select-none"
        aria-label="Mobile Navigation"
      >
        <svg width="0" height="0" className="absolute pointer-events-none">
          <defs>
            <linearGradient id="travally-icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        {/* 100% Circular pill container (rounded-full) */}
        <div ref={navRef} className="pointer-events-auto relative w-full h-[50px] sm:h-[52px] rounded-full bg-white/95 dark:bg-[#0c1410]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-emerald-800/60 shadow-[0_12px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.65),0_0_0_1px_rgba(16,185,129,0.25)] px-1 py-1 flex items-center justify-between gap-0.5">
          <div 
            className="absolute top-1 bottom-1 rounded-full transition-all duration-200 ease-out z-0 pointer-events-none"
            style={{
              left: `${pillStyle.left}px`,
              width: `${pillStyle.width}px`,
              opacity: pillStyle.opacity,
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(20, 184, 166, 0.08))",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              boxShadow: "0 2px 10px rgba(16, 185, 129, 0.12)"
            }}
          />
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isProfileItem = item.id === "profile";
            const isActive = item.id === activeId;

            const content = (
              <>
                <div className="relative flex items-center justify-center shrink-0">
                  {isProfileItem && currentUser?.avatarUrl ? (
                    <div className="relative flex items-center justify-center">
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.displayName || "Profile"}
                        className={`w-5 h-5 min-w-[20px] max-w-[20px] min-h-[20px] max-h-[20px] rounded-full object-cover shrink-0 ring-1.5 transition-all duration-300 ${isActive ? (userBadge ? "ring-amber-400" : "ring-emerald-500/60") : (userBadge ? "ring-amber-400/90 shadow-[0_0_6px_rgba(245,158,11,0.4)]" : "ring-slate-300 dark:ring-emerald-800/80")}`}
                      />
                      {userBadge && (
                        <span className={`absolute -top-1.5 -right-1 text-[7px] leading-none transition-all duration-300 ${isActive ? "scale-110" : ""}`}>
                          👑
                        </span>
                      )}
                    </div>
                  ) : (
                    <Icon 
                      className={`w-5 h-5 shrink-0 transition-all duration-300 ${isActive ? "stroke-[2.5]" : "text-slate-500 dark:text-slate-400 active:scale-90"}`}
                      style={isActive ? { stroke: "url(#travally-icon-gradient)" } : undefined}
                    />
                  )}

                  {/* Badge */}
                  {!!item.badge ? (
                    <span 
                      suppressHydrationWarning
                      className={`transition-all duration-300 absolute -top-1.5 -right-2 min-w-[15px] h-3.5 px-1 rounded-full text-[8px] font-bold inline-flex items-center justify-center ${isActive ? "opacity-0 scale-50" : `opacity-100 scale-100 ${item.badgeColor} ${item.id === "requests" ? "animate-pulse" : ""}`}`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </div>

                {isActive && (
                  <div className="flex items-center overflow-hidden animate-fade-in ml-1.5">
                    <span className="text-xs font-black whitespace-nowrap tracking-tight">
                      {renderGradientLabel(item.label)}
                    </span>
                    {!!item.badge && (
                      <span
                        suppressHydrationWarning
                        className="ml-1.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-300/90 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-100 text-[9px] font-black inline-flex items-center justify-center border border-emerald-400 dark:border-emerald-600 shadow-2xs shrink-0"
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </>
            );

            const baseClasses = `relative z-10 flex items-center justify-center h-full rounded-full select-none transition-all duration-150 active:scale-95 ${isActive ? "px-3 sm:px-4 shrink-0" : "flex-1"}`;

            return (
              <Link
                key={item.id}
                href={item.href}
                data-active={isActive}
                onClick={(e) => {
                  setOptimisticActiveId(item.id);
                  // Immediate measurement on the tapped link for zero latency animation
                  const target = e.currentTarget;
                  if (target) {
                    setPillStyle({
                      left: target.offsetLeft,
                      width: target.offsetWidth,
                      opacity: 1,
                    });
                  }
                }}
                prefetch={true}
                scroll={false}
                className={baseClasses}
                title={item.label}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
