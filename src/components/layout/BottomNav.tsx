"use client";

import React, { useState, useEffect } from "react";
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

const BottomNav: React.FC<BottomNavProps> = () => {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { unreadChatsCount, pendingRequestsCount, totalUnreadMessages } = useBadges();
  const [mounted, setMounted] = useState(false);
  const [optimisticActiveId, setOptimisticActiveId] = useState<string | null>(null);

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

  // 3. Never render dock inside an active private chat room (needs full space for keyboard & input)
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
      badge: null,
    },
    {
      id: "discover",
      label: t.discover || "Discover",
      href: "/discover",
      icon: Compass,
      badge: null,
    },
    {
      id: "create",
      label: t.create || "Create",
      href: "/activities/create",
      icon: PlusCircle,
      badge: null,
    },
    {
      id: "chats",
      label: t.chats || "Chats",
      href: "/chats",
      icon: MessageSquare,
      badge: chatsBadgeDisplay,
    },
    {
      id: "profile",
      label: t.profile || "Profile",
      href: "/profile",
      icon: User,
      isProfile: true,
      badge: null,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0a120e]/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-emerald-950/80 pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.04)] select-none"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isProfileItem = item.id === "profile";
          const isActive = item.id === activeId;

          return (
            <Link
              key={item.id}
              href={item.href}
              data-active={isActive}
              onClick={() => setOptimisticActiveId(item.id)}
              prefetch={true}
              scroll={false}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all duration-150 active:scale-95 group"
              title={item.label}
            >
              {/* Subtle top indicator bar */}
              {isActive && (
                <span className="absolute top-0 w-8 h-[2.5px] rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              )}

              <div className="relative flex items-center justify-center mb-0.5">
                {isProfileItem && currentUser?.avatarUrl ? (
                  <div className="relative flex items-center justify-center">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.displayName || "Profile"}
                      className={`w-[22px] h-[22px] rounded-full object-cover transition-all duration-200 ${
                        isActive
                          ? "ring-2 ring-emerald-500 shadow-xs"
                          : "ring-1 ring-slate-300 dark:ring-emerald-900/60 group-hover:ring-slate-400"
                      }`}
                    />
                    {userBadge && (
                      <span className="absolute -top-1.5 -right-1 text-[7px] leading-none">
                        👑
                      </span>
                    )}
                  </div>
                ) : (
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400 stroke-[2.4] scale-105"
                        : "text-slate-400 dark:text-slate-500 stroke-[1.9] group-hover:text-slate-700 dark:group-hover:text-slate-300"
                    }`}
                  />
                )}

                {/* Badge */}
                {!!item.badge && (
                  <span
                    suppressHydrationWarning
                    className="absolute -top-1.5 -right-2 min-w-[15px] h-3.5 px-1 rounded-full text-[8px] font-bold inline-flex items-center justify-center bg-emerald-500 text-white shadow-xs"
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] leading-tight tracking-tight transition-colors duration-200 ${
                  isActive
                    ? "font-bold text-emerald-700 dark:text-emerald-400"
                    : "font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
