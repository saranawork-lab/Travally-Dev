"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo, LogoMark } from "@/components/common/Logo";
import { ModeToggle, AppMode } from "@/components/common/ModeToggle";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { Search, X, Sparkles, SlidersHorizontal } from "lucide-react";
import { LiquidWaveButton } from "@/components/ui/LiquidWaveButton";

interface NavbarProps {
  initialMode?: AppMode;
  onModeChange?: (mode: AppMode) => void;
  initialUser?: any;
}

const Navbar: React.FC<NavbarProps> = ({
  initialMode = "companion",
  onModeChange,
  initialUser = null,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mode, setMode] = useState<AppMode>(initialMode);
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync search query and mode with URL params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get("search") || "");
      const urlMode = params.get("mode") as AppMode;
      if (urlMode === "companion" || urlMode === "travel") {
        setMode(urlMode);
      }
    }
  }, [pathname]);

  // Listen to sidebar state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleSidebarState = (e: any) => {
        setIsSidebarOpen(Boolean(e.detail?.expanded));
      };
      window.addEventListener("travally-sidebar-state", handleSidebarState);
      return () => window.removeEventListener("travally-sidebar-state", handleSidebarState);
    }
  }, []);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > (window.innerHeight * 0.8));
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Reset states on route change
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsMobileSearchOpen(false);
  }, [pathname]);

  // Global keyboard shortcut for search (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsMobileSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("travally-search", { detail: q }));
      const params = new URLSearchParams(window.location.search);
      if (q.trim()) {
        params.set("search", q.trim());
      } else {
        params.delete("search");
      }
      const currentMode = params.get("mode") || (pathname.startsWith("/travel") ? "travel" : "companion");
      params.set("mode", currentMode);
      router.replace(`/discover?${params.toString()}`);
    }
  };

  const handleModeSwitch = (newMode: AppMode) => {
    setMode(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("search") : null;
      const query = search ? `?mode=${newMode}&search=${encodeURIComponent(search)}` : `?mode=${newMode}`;
      router.push(`/discover${query}`);
    }
  };

  // Hide global navbar inside active single chat rooms and full-screen onboarding
  if (
    (pathname?.startsWith("/chats/") && pathname !== "/chats") ||
    pathname?.startsWith("/onboarding")
  ) {
    return null;
  }

  const isAuthOrLandingPage = pathname === "/" || pathname === "/login" || pathname === "/register";
  const shouldAnimateLogo = isAuthOrLandingPage ? true : isSidebarOpen;
  const isLandingPage = pathname === "/";
  const isTransparent = isLandingPage && !isScrolled;
  const isLoggedInApp = currentUser && !isAuthOrLandingPage;

  return (
    <header
      className={`z-40 w-full transition-all duration-300 ${
        isLandingPage ? "fixed top-0" : "sticky top-0"
      } ${
        isTransparent
          ? "bg-transparent border-transparent"
          : "bg-white/80 dark:bg-[#0f1713]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-emerald-900/30 shadow-sm"
      }`}
    >

      <div className="w-full px-3 sm:px-6 md:px-8 lg:px-12 h-16 sm:h-17 flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* Left: Brand Area */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={currentUser ? "/discover" : "/"}
            className="flex items-center gap-2 transition-transform duration-200 hover:scale-[1.02] active:scale-98 group"
            title="Travally"
          >
            <Logo
              size={32}
              showText={true}
              textClassName="text-lg sm:text-xl font-black tracking-tight"
              animate={shouldAnimateLogo}
              animateType={isSidebarOpen ? "smooth" : "stay"}
              themeVariant={isTransparent ? "dark" : "auto"}
              revealAnimation={true}
            />
          </Link>
        </div>

        {/* Center: In-App Search & Mode Switcher (Desktop & Tablet) */}
        {isLoggedInApp && (
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-xl mx-auto justify-center">
            {/* Sleek Search Pill */}
            <div
              className={`relative flex items-center w-full max-w-xs transition-all duration-300 rounded-full ${
                isSearchFocused
                  ? "max-w-md ring-2 ring-emerald-500/50"
                  : ""
              }`}
            >
              <Search
                className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                  isSearchFocused
                    ? "text-emerald-500"
                    : "text-slate-400"
                }`}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search activities, trips, vibes..."
                className="w-full pl-10 pr-16 py-2 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/80 border border-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500/30 transition-all"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden lg:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-700/60 pointer-events-none">
                  ⌘K
                </kbd>
              )}
            </div>

            {/* Mode Switcher */}
            <div className="shrink-0">
              <ModeToggle currentMode={mode} onModeChange={handleModeSwitch} size="sm" />
            </div>
          </div>
        )}

        {/* Right Actions: Search Trigger (Mobile), Theme Toggle, Notifications & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
          {/* Mobile Search Toggle Button */}
          {isLoggedInApp && (
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen((prev) => !prev);
                if (!isMobileSearchOpen) {
                  setTimeout(() => searchInputRef.current?.focus(), 80);
                }
              }}
              className={`md:hidden p-2 rounded-full transition-all active:scale-90 ${
                isMobileSearchOpen
                  ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14201a]"
              }`}
              aria-label="Search"
              title="Search"
            >
              {isMobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          )}

          {/* Theme Toggle Button */}
          <div className="shrink-0">
            <ThemeToggle />
          </div>

          {/* In-App Notifications Dropdown */}
          {isLoggedInApp ? (
            <NotificationDropdown />
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              {currentUser && pathname === "/" ? (
                <LiquidWaveButton href="/discover">
                  Discover
                </LiquidWaveButton>
              ) : pathname === "/login" ? (
                <LiquidWaveButton href="/register" size="sm">
                  Join Free
                </LiquidWaveButton>
              ) : pathname === "/register" ? (
                <Link
                  href="/login"
                  className="group relative px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap overflow-hidden"
                >
                  <span className="relative z-10 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Log In</span>
                  <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 scale-0 group-hover:scale-100 rounded-full transition-transform duration-300 origin-center" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`group relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap overflow-hidden ${
                      isTransparent
                        ? "text-white/90"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <span className={`relative z-10 transition-colors ${isTransparent ? "group-hover:text-white" : "group-hover:text-emerald-600 dark:group-hover:text-emerald-400"}`}>Log In</span>
                    <div className={`absolute inset-0 scale-0 group-hover:scale-100 rounded-full transition-transform duration-300 origin-center ${isTransparent ? "bg-white/10" : "bg-slate-50 dark:bg-[#131c18]"}`} />
                  </Link>
                  <LiquidWaveButton href="/register">
                    Join Free
                  </LiquidWaveButton>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Expandable Search Bar Drawer (Smooth Slide-down) */}
      {isLoggedInApp && isMobileSearchOpen && (
        <div className="md:hidden px-3.5 pb-3 pt-1 border-t border-slate-100 dark:border-emerald-950/60 bg-white/95 dark:bg-[#090e0b]/95 backdrop-blur-xl animate-slide-up">
          <div className="relative flex items-center w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 dark:text-emerald-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search activities, trips, companions..."
              className="w-full pl-10 pr-9 py-2 rounded-2xl text-xs font-medium bg-slate-100 dark:bg-[#14201a] border border-emerald-500/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
