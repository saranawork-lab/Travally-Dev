"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo, LogoMark } from "@/components/common/Logo";
import { ModeToggle, AppMode } from "@/components/common/ModeToggle";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleSidebarState = (e: any) => {
        setIsSidebarOpen(Boolean(e.detail?.expanded));
      };
      window.addEventListener("travally-sidebar-state", handleSidebarState);
      return () => window.removeEventListener("travally-sidebar-state", handleSidebarState);
    }
  }, []);

  // Track scroll position to transition the navbar on the landing page
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

  // When route changes, ensure sidebar state is immediately reset to closed
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const handleMobileSearch = (q: string) => {
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

  // Hide global navbar inside active chat rooms and full-screen onboarding (AFTER all hooks have executed)
  if (
    (pathname?.startsWith("/chats/") && pathname !== "/chats") ||
    pathname?.startsWith("/onboarding")
  ) {
    return null;
  }

  const isAuthOrLandingPage = pathname === "/" || pathname === "/login" || pathname === "/register";
  const shouldAnimateLogo = isAuthOrLandingPage ? true : isSidebarOpen;

  // Determine navbar styles based on route and scroll
  const isLandingPage = pathname === "/";
  const isTransparent = isLandingPage && !isScrolled;

  return (
    <header className={`z-40 w-full transition-all duration-500 ${
      isLandingPage ? "fixed top-0" : "sticky top-0"
    } ${
      isTransparent
        ? "bg-black/10 backdrop-blur-md border-transparent shadow-none"
        : "bg-white dark:bg-[#090d0b] border-b border-slate-100/90 dark:border-emerald-950/60 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.04)] dark:shadow-none"
    }`}>
      <div className="w-full px-3 sm:px-8 md:px-10 lg:px-12 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* Brand Area */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop/Tablet Logo: Animates ONLY when sidebar opens (or on login/register/landing) */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-2.5 transition hover:opacity-90 shrink-0 group"
          >
            <Logo
              size={36}
              animate={shouldAnimateLogo}
              animateType={isSidebarOpen ? "smooth" : "stay"}
              themeVariant={isTransparent ? "dark" : "auto"}
              revealAnimation={true}
            />
          </Link>

          {/* Mobile Responsive: Single Clean Logo when logged out/landing, or LogoMark + Search when logged in */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            {currentUser && pathname !== "/" ? (
              <>
                <Link
                  href="/"
                  className="flex items-center shrink-0 transition hover:opacity-90"
                  title="Travally"
                >
                  <Logo
                    size={26}
                    showText
                    textClassName="text-base sm:text-xl font-black tracking-tight"
                    animate={isAuthOrLandingPage}
                    themeVariant={isTransparent ? "dark" : "auto"}
                  />
                </Link>

              </>
            ) : (
              <Link href="/" className="flex items-center gap-1 transition hover:opacity-90 shrink-0">
                <Logo
                  size={26}
                  showText
                  textClassName="text-base sm:text-xl font-black tracking-tight"
                  themeVariant={isTransparent ? "dark" : "auto"}
                  revealAnimation={true}
                />
              </Link>
            )}
          </div>
        </div>

        {/* ── LOGGED-IN NAV: Central Mode Toggle (In-App Pages Only, NOT on login/register/landing) ── */}
        {currentUser && pathname !== "/" && pathname !== "/login" && pathname !== "/register" && (
          <div className="hidden sm:flex items-center justify-center absolute left-1/2 -translate-x-1/2 pointer-events-auto">
            <ModeToggle currentMode={mode} onModeChange={handleModeSwitch} size="sm" />
          </div>
        )}

        {/* Right Actions: Theme Toggle, Notifications & Profile / Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
          {/* Functional Light/Dark Mode Switcher: scaled slightly on mobile to guarantee comfortable fit */}
          <div className="scale-[0.82] sm:scale-100 origin-right -mr-1 sm:mr-0 shrink-0">
            <ThemeToggle />
          </div>

          {currentUser && pathname !== "/" && pathname !== "/login" && pathname !== "/register" ? (
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
                  className="group relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap overflow-hidden"
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
    </header>
  );
};

export default Navbar;
