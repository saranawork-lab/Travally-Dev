"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  PlusCircle,
  Inbox,
  MessageSquare,
  User,
} from "lucide-react";
import { useBadges } from "@/hooks/useBadges";
import { useAuth } from "@/context/AuthContext";
import { AvatarBadge } from "@/components/common/AvatarBadge";
import { getBadgeForRank, parseRankFromMembership } from "@/lib/badges";

interface BottomNavProps {
  initialUser?: any;
}

export default function BottomNav({ initialUser }: BottomNavProps) {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { unreadChatsCount, pendingRequestsCount, totalUnreadMessages } = useBadges();

  if (!currentUser) return null;

  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname?.startsWith("/onboarding") ||
    (pathname?.startsWith("/chats/") && pathname !== "/chats")
  ) {
    return null;
  }

  const isCreate =
    pathname.startsWith("/activities/create") ||
    pathname.startsWith("/travel/create");
  const isRequests = pathname.startsWith("/requests");
  const isChats = pathname.startsWith("/chats");
  const isProfile =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/safety") ||
    pathname.startsWith("/admin");

  const activeId = isProfile
    ? "profile"
    : isChats
    ? "chats"
    : isRequests
    ? "requests"
    : isCreate
    ? "create"
    : "discover";

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  };

  const navItems = [
    {
      id: "discover",
      label: "Discover",
      href: "/discover",
      icon: Compass,
    },
    {
      id: "create",
      label: "Create",
      href: currentUser?.mode === "traveler" ? "/travel/create" : "/activities/create",
      icon: PlusCircle,
    },
    {
      id: "requests",
      label: "Requests",
      href: "/requests",
      icon: Inbox,
      badge: pendingRequestsCount,
    },
    {
      id: "chats",
      label: "Chats",
      href: "/chats",
      icon: MessageSquare,
      badge: totalUnreadMessages > 0 ? (totalUnreadMessages > 9 ? "9+" : totalUnreadMessages) : (unreadChatsCount > 9 ? "9+" : unreadChatsCount),
    },
    {
      id: "profile",
      label: "Profile",
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0f1713]/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-emerald-900/30 pb-safe"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;
          const isProfileItem = item.id === "profile";

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={triggerHaptic}
              prefetch={true}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
            >
              <div className="relative">
                {isProfileItem && currentUser?.avatarUrl ? (
                  <div className={`rounded-full p-[2px] transition-colors ${isActive ? 'bg-emerald-500' : 'bg-transparent'}`}>
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.displayName || "Profile"}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <Icon
                    className={`w-6 h-6 transition-colors duration-200 ${
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                )}

                {item.badge && item.badge !== 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-[#0f1713]">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400"
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
}
