"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/common/Logo";
import { AppMode } from "@/components/common/ModeToggle";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Search, X } from "lucide-react";
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
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

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
    setIsSearchOpen(false);
  }, [pathname]);

  // Global keyboard shortcuts (⌘K / Ctrl+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => mobileSearchInputRef.current?.focus() || searchInputRef.current?.focus(), 80);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
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



  // Hide global navbar inside active single chat rooms and full-screen onboarding
  if (
    (pathname?.startsWith("/chats/") && pathname !== "/chats") ||
    pathname?.startsWith("/onboarding")
  ) {
    return null;
  }

  const isAuthOrLandingPage = pathname === "/login" || pathname === "/register";
  const shouldAnimateLogo = isAuthOrLandingPage ? true : isSidebarOpen;
  const isDiscoverPage = pathname === "/discover";
  
  // Discover page navbar is absolute, so it always sits on the hero and is transparent
  const isTransparent = isDiscoverPage;
  const isLoggedInApp = currentUser && !isAuthOrLandingPage;

  return (
    <header
      className={`z-40 w-full transition-all duration-300 ${
        isDiscoverPage ? "absolute top-0" : "sticky top-0"
      } ${
        isTransparent
          ? "bg-transparent border-transparent"
          : "bg-white/80 dark:bg-[#0f1713]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-emerald-900/30 shadow-sm"
      }`}
    >

      <div className="w-full px-3 sm:px-6 md:px-8 lg:px-12 h-14 sm:h-14 flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* Left: Brand Area */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop/Tablet Logo */}
          <Link
            href={currentUser ? "/discover" : "/"}
            className="hidden sm:flex items-center gap-2.5 transition hover:opacity-90 shrink-0 group"
          >
            <Logo
              size={34}
              showText={true}
              textClassName="text-lg sm:text-xl font-black tracking-tight"
              animate={shouldAnimateLogo}
              animateType={isSidebarOpen ? "smooth" : "stay"}
              themeVariant="auto"
              revealAnimation={true}
            />
          </Link>

          {/* Mobile Responsive Logo */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <Link
              href={currentUser ? "/discover" : "/"}
              className="flex items-center shrink-0 transition hover:opacity-90"
              title="Travally"
            >
              <Logo
                size={26}
                showText={true}
                textClassName="text-base font-black tracking-tight"
                animate={isAuthOrLandingPage}
                themeVariant="auto"
              />
            </Link>
          </div>
        </div>

        {/* Center: In-App Search (Desktop & Tablet) - True Center */}
        {isLoggedInApp && (
          <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 pointer-events-auto w-full max-w-sm lg:max-w-md z-10">
            {/* Sleek Search Pill */}
            <div
              className={`relative flex items-center w-full transition-all duration-300 rounded-full ${isSearchFocused
                  ? "ring-2 ring-emerald-500/50 shadow-sm"
                  : ""
                }`}
            >
              <Search
                className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${isSearchFocused
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
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-10 py-2 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/80 border border-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right Actions: Search, Notifications & Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
          {/* Search Icon & In-App Notifications Dropdown */}
          {isLoggedInApp ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (!isSearchOpen) {
                    setTimeout(() => mobileSearchInputRef.current?.focus(), 80);
                  }
                }}
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16201b] transition-all relative cursor-pointer"
                aria-label="Search"
                title="Search anything (trips, companions, destinations)"
              >
                <Search className="w-5 h-5" />
              </button>

              <NotificationDropdown />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {pathname === "/login" ? (
                <LiquidWaveButton href="/register" size="sm">
                  {t.joinFree}
                </LiquidWaveButton>
              ) : pathname === "/register" ? (
                <Link
                  href="/login"
                  className="group relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap overflow-hidden"
                >
                  <span className="relative z-10 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{t.login}</span>
                  <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 scale-0 group-hover:scale-100 rounded-full transition-transform duration-300 origin-center" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="group relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap overflow-hidden"
                  >
                    <span className="relative z-10 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{t.login}</span>
                    <div className="absolute inset-0 scale-0 group-hover:scale-100 rounded-full transition-transform duration-300 origin-center bg-slate-100 dark:bg-[#131c18]" />
                  </Link>
                  <LiquidWaveButton href="/register" size="sm">
                    {t.joinFree}
                  </LiquidWaveButton>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar Overlay when Search button is active */}
      {isSearchOpen && (
        <div className="absolute inset-x-0 top-0 h-14 bg-white dark:bg-[#0f1713] px-3 sm:px-6 flex items-center gap-2 z-50 border-b border-slate-200 dark:border-emerald-900/30 shadow-md animate-in fade-in duration-150">
          <Search className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />
          <input
            ref={mobileSearchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setIsSearchOpen(false);
              }
            }}
            placeholder={t.searchPlaceholder || "Search anything (trips, companions, destinations)..."}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
