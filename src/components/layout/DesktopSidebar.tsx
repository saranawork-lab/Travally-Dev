"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  PlusCircle,
  Inbox,
  MessageSquare,
  Shield,
  ChevronRight,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useBadges } from "@/hooks/useBadges";
import { useAuth } from "@/context/AuthContext";
import { AvatarBadge } from "@/components/common/AvatarBadge";
import { getBadgeForRank, parseRankFromMembership } from "@/lib/badges";
import { ModeToggle, AppMode } from "@/components/common/ModeToggle";


interface DesktopSidebarProps {
  initialUser?: any;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { unreadChatsCount, pendingRequestsCount, totalUnreadMessages } = useBadges();

  // State: whether user is hovering over the sidebar
  const [isHovered, setIsHovered] = useState(false);
  // State: when an option is clicked, force sidebar to shrink immediately
  const [forceCollapsed, setForceCollapsed] = useState(false);

  // Sync mode (companion vs travel) from URL or user preference
  const [mode, setMode] = useState<"companion" | "travel">("companion");

  const userRank = currentUser?.joinRank || parseRankFromMembership(currentUser?.membershipNumber);
  const userBadge = getBadgeForRank(userRank);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get("mode");
      if (urlMode === "companion" || urlMode === "travel") {
        setMode(urlMode);
      } else if (currentUser?.mode === "traveler") {
        setMode("travel");
      }
    }
  }, [pathname, currentUser]);

  // Helper to notify navbar of sidebar open/close state immediately
  const dispatchSidebarState = (expanded: boolean) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("travally-sidebar-state", {
          detail: { expanded },
        })
      );
    }
  };

  // When route changes, shrink sidebar to collapsed state
  useEffect(() => {
    setForceCollapsed(true);
    setIsHovered(false);
    dispatchSidebarState(false);
  }, [pathname]);  // Mouse hover handlers
  const handleMouseEnter = () => {
    setForceCollapsed(false);
    setIsHovered(true);
    dispatchSidebarState(true);
  };

  const handleMouseLeave = () => {
    setForceCollapsed(false);
    setIsHovered(false);
    dispatchSidebarState(false);
  };

  // Click handler: immediately shrink sidebar back to icons-only mode
  const handleItemClick = () => {
    setForceCollapsed(true);
    setIsHovered(false);
    dispatchSidebarState(false);
  };

  const handleModeSwitch = (newMode: AppMode) => {
    setMode(newMode);
    const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("search") : null;
    const query = search ? `?mode=${newMode}&search=${encodeURIComponent(search)}` : `?mode=${newMode}`;
    router.push(`/discover${query}`);
  };

  const handleLogout = async () => {
    setForceCollapsed(true);
    setIsHovered(false);
    dispatchSidebarState(false);
    await logout();
    router.push("/");
  };

  const isExpanded = isHovered && !forceCollapsed;

  // Broadcast sidebar expansion state
  useEffect(() => {
    dispatchSidebarState(isExpanded);
  }, [isExpanded]);

  // Active item determination
  const isDiscover = pathname.startsWith("/discover");
  const isCreate = pathname.startsWith("/activities/create") || pathname.startsWith("/travel/create");
  const isRequests = pathname.startsWith("/requests");
  const isChats = pathname.startsWith("/chats");
  const isSafety = pathname.startsWith("/safety");
  const isProfileActive = pathname.startsWith("/profile") || pathname.startsWith("/settings");

  // Hide sidebar when not logged in, or on landing, full-screen onboarding, login, register, and single chat rooms
  if (
    !currentUser ||
    pathname === "/" ||
    pathname?.startsWith("/onboarding") ||
    pathname === "/login" ||
    pathname === "/register" ||
    (pathname?.startsWith("/chats/") && pathname !== "/chats")
  ) {
    return null;
  }

  const navItems = [
    {
      id: "discover",
      label: "Discover",
      href: `/discover?mode=${mode}`,
      icon: Compass,
      isActive: isDiscover,
      badge: 0,
      badgeColor: "bg-emerald-500",
    },
    {
      id: "create",
      label: "Create",
      href: mode === "companion" ? "/activities/create" : "/travel/create",
      icon: PlusCircle,
      isActive: isCreate,
      badge: 0,
      badgeColor: "bg-emerald-500",
    },
    {
      id: "requests",
      label: "Requests",
      href: "/requests",
      icon: Inbox,
      isActive: isRequests,
      badge: pendingRequestsCount,
      badgeColor: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-900 border border-orange-300/80 shadow-xs",
    },
    {
      id: "chats",
      label: "Chats",
      href: "/chats",
      icon: MessageSquare,
      isActive: isChats,
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
      id: "safety",
      label: "Safety",
      href: "/safety",
      icon: Shield,
      isActive: isSafety,
      badge: 0,
      badgeColor: "bg-emerald-500",
    },
  ];

  return (
    <div className="hidden md:block shrink-0 w-[68px] relative select-none">
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed left-0 top-16 sm:top-18 bottom-0 z-30 flex flex-col bg-white/95 dark:bg-[#0c1410]/95 backdrop-blur-2xl border-r border-slate-200/85 dark:border-emerald-950/80 transition-all duration-300 ease-in-out ${isExpanded
            ? "w-60 shadow-[10px_0_36px_rgba(0,0,0,0.12)] dark:shadow-[12px_0_40px_rgba(0,0,0,0.7)]"
            : "w-[68px] shadow-[2px_0_10px_rgba(0,0,0,0.02)]"
          }`}
        aria-label="Desktop and Tablet Sidebar Navigation"
      >
        {/* Navigation items list - Centered vertically in sidebar */}
        <div className="flex-1 flex flex-col justify-center px-2 py-4 space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={handleItemClick}
                prefetch={true}
                scroll={false}
                title={!isExpanded ? item.label : undefined}
                className={`group relative flex items-center h-11 w-full rounded-2xl overflow-hidden transition-colors duration-200 ${item.isActive
                    ? "bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/80 dark:to-teal-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-400/40 dark:border-emerald-600/50 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-[#16221c] border border-transparent"
                  }`}
              >
                {/* Fixed-width stationary icon slot: NEVER moves between collapsed & expanded (exact 34px center anchor) */}
                <div className="w-[52px] h-11 shrink-0 flex items-center justify-center relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${item.isActive
                        ? "text-emerald-600 dark:text-emerald-400 stroke-[2.4]"
                        : "text-slate-500 dark:text-slate-400 stroke-[2]"
                      }`}
                  />

                  {/* Badge in collapsed mode: Compact pill docked on top-right of the 52px icon slot */}
                  {!isExpanded && item.badge && item.badge !== 0 ? (
                    <span
                      className={`absolute top-1.5 right-2 min-w-[15px] h-3.5 px-1 rounded-full text-[8px] font-bold inline-flex items-center justify-center ${item.badgeColor
                        } ${item.id === "requests" ? "animate-pulse" : ""}`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </div>

                {/* Text Label & Badge in expanded mode: Smoothly fades/slides to the right with 0px movement on icon */}
                <div
                  className={`flex-1 flex items-center justify-between min-w-0 pr-3 transition-opacity duration-200 ${isExpanded
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                    }`}
                >
                  <span
                    className={`text-xs font-semibold truncate ${item.isActive
                        ? "text-emerald-900 dark:text-emerald-200 font-bold"
                        : "text-slate-700 dark:text-slate-200"
                      }`}
                  >
                    {item.label}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                    {item.badge && item.badge !== 0 ? (
                      <span
                        className={`min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-bold inline-flex items-center justify-center ${item.badgeColor
                          } ${item.id === "requests" ? "animate-pulse" : ""}`}
                      >
                        {item.badge}
                      </span>
                    ) : null}

                    {item.isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow animate-pulse" />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Down below at the bottom of the sidebar: Profile Button & Dropdown */}
        <div className="px-2 pb-3 pt-2 border-t border-slate-200/80 dark:border-emerald-950/80 mt-auto">
          <div className="relative">
            <Link
              href="/profile"
              onClick={handleItemClick}
              title={!isExpanded ? (currentUser.displayName || "My Profile") : undefined}
              className={`group relative flex items-center h-12 w-full rounded-2xl overflow-hidden transition-colors duration-200 ${isProfileActive
                  ? "bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/80 dark:to-teal-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-400/40 dark:border-emerald-600/50 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-[#16221c] border border-transparent"
                }`}
            >
              {/* Profile Avatar circle in fixed stationary slot (exact 34px center anchor) */}
              <div className="w-[52px] h-12 shrink-0 flex items-center justify-center relative">
                <AvatarBadge
                  src={currentUser.avatarUrl}
                  name={currentUser.displayName}
                  rank={userRank}
                  badge={userBadge}
                  size="xs"
                  showCrown={true}
                  className="transition-transform duration-200 group-hover:scale-105"
                />
              </div>

              {/* Text Label & Subtitle in expanded mode: Smoothly fades with 0px movement on avatar */}
              <div
                className={`flex-1 flex items-center justify-between min-w-0 pr-3 transition-opacity duration-200 text-left ${isExpanded
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                  }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentUser.displayName || "My Profile"}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {userBadge ? userBadge.title : "Profile & Settings"}
                  </p>
                </div>
              </div>
            </Link>


          </div>
        </div>
      </aside>
    </div>
  );
};

export default DesktopSidebar;
