"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Users, Luggage } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface PrimaryNavigationProps {
  initialUser?: any;
}

const PrimaryNavigationContent: React.FC<PrimaryNavigationProps> = ({ initialUser }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (tickingRef.current) return;
    tickingRef.current = true;
    requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const lastY = lastScrollYRef.current;

      if (currentScrollY > lastY && currentScrollY > 50) {
        setIsVisible(false);
      } else if (currentScrollY < lastY - 10 || currentScrollY <= 50) {
        setIsVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
      tickingRef.current = false;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Determine active tab - ALWAYS call hooks at the top level
  const [optimisticTab, setOptimisticTab] = useState<string | null>(null);

  useEffect(() => {
    setOptimisticTab(null);
  }, [searchParams, pathname]);

  // Hide on auth, landing, onboarding, single chats
  if (!initialUser) return null;
  const isAuthOrLandingPage = pathname === "/" || pathname === "/login" || pathname === "/register";
  if (isAuthOrLandingPage) return null;
  if (pathname?.startsWith("/chats")) return null;
  if (pathname?.startsWith("/onboarding")) return null;
  if (pathname?.startsWith("/profile")) return null;
  if (pathname?.includes("/create")) return null;
  if (pathname?.startsWith("/requests")) return null;
  if (pathname?.startsWith("/settings")) return null;
  if (pathname?.startsWith("/safety")) return null;
  if (pathname?.startsWith("/admin")) return null;

  const mode = searchParams.get("mode");
  let resolvedActiveTab: string | null = null;

  if (pathname === "/discover") {
    if (mode === "travel") resolvedActiveTab = "travel";
    else if (mode === "companion") resolvedActiveTab = "companion";
    else if (mode === "near-you") resolvedActiveTab = "near-you";
  } else if (pathname?.startsWith("/travel")) {
    resolvedActiveTab = "travel";
  } else if (pathname?.startsWith("/activities")) {
    resolvedActiveTab = "companion";
  }

  const activeTab = optimisticTab || resolvedActiveTab;

  const isCardDetail = Boolean(
    (pathname?.startsWith("/travel/") && pathname !== "/travel/create") ||
    (pathname?.startsWith("/activities/") && pathname !== "/activities/create")
  );

  const navItems = [
    {
      id: "companion",
      label: t.companion,
      href: "/discover?mode=companion",
      icon: Users,
      activeBorderClass: "border-emerald-500",
      activeTextClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "travel",
      label: t.travel,
      href: "/discover?mode=travel",
      icon: Luggage,
      activeBorderClass: "border-orange-500",
      activeTextClass: "text-orange-600 dark:text-orange-400",
    },
  ];

  const displayedNavItems = isCardDetail
    ? navItems.filter((item) => item.id === activeTab).length > 0
      ? navItems.filter((item) => item.id === activeTab)
      : navItems
    : navItems;

  const isDiscoverHome = pathname === "/discover";
  const shouldHideBecauseTop = isDiscoverHome && lastScrollYRef.current < 150;
  
  const finallyVisible = isVisible && !shouldHideBecauseTop;

  return (
    <div
      className={`w-full bg-white dark:bg-[#0f1713] border-b border-slate-200 dark:border-emerald-900/30 transition-all duration-300 ease-in-out z-30 ${isDiscoverHome ? "fixed top-16 sm:top-17" : "sticky top-16 sm:top-17"}`}
      style={{
        transform: finallyVisible ? 'translateY(0)' : 'translateY(-150%)',
        opacity: finallyVisible ? 1 : 0,
        pointerEvents: finallyVisible ? "auto" : "none"
      }}
    >
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 flex items-center ${
          isCardDetail ? "justify-center sm:justify-start" : "justify-between sm:justify-start sm:gap-12"
        } h-14`}
      >
        {displayedNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setOptimisticTab(item.id)}
              prefetch={true}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                isCardDetail ? "px-6 sm:px-4 shrink-0" : "flex-1 sm:flex-none"
              } h-full border-b-[3px] transition-all ${
                isActive
                  ? `${item.activeBorderClass} ${item.activeTextClass}`
                  : "border-transparent text-[#0B2345] dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300"
              }`}
            >
              <Icon className={`w-5 h-5 sm:w-4 sm:h-4 ${isActive ? item.activeTextClass : ""}`} />
              <span className={`text-[10px] sm:text-sm font-bold tracking-wide ${isActive ? "" : "opacity-90"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const PrimaryNavigation: React.FC<PrimaryNavigationProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <PrimaryNavigationContent {...props} />
    </Suspense>
  );
};

export default PrimaryNavigation;

