"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  PlusCircle,
  Inbox,
  MessageSquare,
  User,
  Settings,
  Shield,
  LogOut,
  LayoutDashboard,
  ChevronRight,
  X,
  Award,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useBadges } from "@/hooks/useBadges";
import { useAuth } from "@/context/AuthContext";
import { AvatarBadge } from "@/components/common/AvatarBadge";
import { getBadgeForRank, parseRankFromMembership } from "@/lib/badges";

interface BottomNavProps {
  initialUser?: any;
}

const renderGradientLabel = (label: string) => {
  const gradientClass = "text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-emerald-500";
  const orangeClass = "text-orange-500";
  const emeraldClass = "text-emerald-500";

  switch (label) {
    case "Discover":
      return <><span className={orangeClass}>Dis</span><span className={gradientClass}>co</span><span className={emeraldClass}>ver</span></>;
    case "Create":
      return <><span className={orangeClass}>Cr</span><span className={gradientClass}>ea</span><span className={emeraldClass}>te</span></>;
    case "Requests":
      return <><span className={orangeClass}>Req</span><span className={gradientClass}>ue</span><span className={emeraldClass}>sts</span></>;
    case "Chats":
      return <><span className={orangeClass}>Ch</span><span className={gradientClass}>a</span><span className={emeraldClass}>ts</span></>;
    case "Profile":
      return <><span className={orangeClass}>Pro</span><span className={gradientClass}>f</span><span className={emeraldClass}>ile</span></>;
    default:
      return <span className={emeraldClass}>{label}</span>;
  }
};

const BottomNav: React.FC<BottomNavProps> = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { unreadChatsCount, pendingRequestsCount, totalUnreadMessages } = useBadges();
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRef = React.useRef<HTMLDivElement>(null);

  const userRank = currentUser?.joinRank || parseRankFromMembership(currentUser?.membershipNumber);
  const userBadge = getBadgeForRank(userRank);



  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // 1. NEVER render bottom dock when not logged in
  if (!currentUser) return null;

  // 2. NEVER render on public landing page or auth/onboarding pages
  if (
    pathname === "/" ||
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

  // Determine active item
  const isCreate = pathname.startsWith("/activities/create") || pathname.startsWith("/travel/create");
  const isRequests = pathname.startsWith("/requests");
  const isChats = pathname.startsWith("/chats");
  const isProfile =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/safety") ||
    pathname.startsWith("/admin");
  const isDiscover = !isCreate && !isRequests && !isChats && !isProfile;

  const activeId = isProfile
    ? "profile"
    : isChats
      ? "chats"
      : isRequests
        ? "requests"
        : isCreate
          ? "create"
          : "discover";

  useEffect(() => {
    let animationFrameId: number;

    const updatePill = () => {
      if (!navRef.current) return;
      const activeEl = navRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeEl) {
        setPillStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1,
        });
      }
    };

    // Initial positioning
    updatePill();

    // Set up a ResizeObserver to flawlessly track width changes during CSS transitions
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updatePill);
    });

    if (navRef.current) {
      observer.observe(navRef.current);
      // Observe all child elements so we track their flex layout transitions
      Array.from(navRef.current.children).forEach((child) => observer.observe(child));
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeId, pathname]);

  const navItems = [
    {
      id: "discover",
      label: "Discover",
      href: "/discover",
      icon: Compass,
      badge: 0,
      badgeColor: "bg-emerald-500",
    },
    {
      id: "create",
      label: "Create",
      href: currentUser?.mode === "traveler" ? "/travel/create" : "/activities/create",
      icon: PlusCircle,
      badge: 0,
      badgeColor: "bg-emerald-500",
    },
    {
      id: "requests",
      label: "Requests",
      href: "/requests",
      icon: Inbox,
      badge: pendingRequestsCount,
      badgeColor: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-900 border border-orange-300/80 shadow-xs",
    },
    {
      id: "chats",
      label: "Chats",
      href: "/chats",
      icon: MessageSquare,
      badge:
        totalUnreadMessages > 0
          ? totalUnreadMessages > 9
            ? "9+"
            : totalUnreadMessages
          : unreadChatsCount > 9
            ? "9+"
            : unreadChatsCount,
      badgeColor: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-900 border border-emerald-300/80 shadow-xs",
    },
    {
      id: "profile",
      label: "Profile",
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
        className="md:hidden fixed bottom-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[460px] z-50 pointer-events-none select-none"
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
        <div ref={navRef} className="pointer-events-auto relative w-full h-[52px] rounded-full bg-white/95 dark:bg-[#0c1410]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-emerald-800/60 shadow-[0_12px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.65),0_0_0_1px_rgba(16,185,129,0.25)] px-1.5 py-1.5 flex items-center justify-between gap-1">
          <div 
            className="absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-0"
            style={{
              left: `${pillStyle.left}px`,
              width: `${pillStyle.width}px`,
              opacity: pillStyle.opacity,
              background: "transparent",
              border: "1px solid rgba(148, 163, 184, 0.4)"
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
                      <span className="ml-1.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-300/90 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-100 text-[9px] font-black inline-flex items-center justify-center border border-emerald-400 dark:border-emerald-600 shadow-2xs shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </>
            );

            const baseClasses = `relative z-10 flex items-center justify-center h-full rounded-full select-none ${isActive ? "px-4 shrink-0" : "flex-1"}`;

            return (
              <Link
                key={item.id}
                href={item.href}
                data-active={isActive}
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
