"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Users, MapPin, Luggage } from "lucide-react";

interface PrimaryNavigationProps {
  initialUser?: any;
}

export const PrimaryNavigation: React.FC<PrimaryNavigationProps> = ({ initialUser }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Hide when scrolling down, show when scrolling up
          if (currentScrollY > lastScrollY && currentScrollY > 50) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY - 10 || currentScrollY <= 50) {
            setIsVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

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

  // Determine active tab
  const mode = searchParams.get("mode");
  let activeTab: string | null = null; // default to no active tab (Home)

  if (pathname === "/discover") {
    if (mode === "travel") activeTab = "travel";
    else if (mode === "companion") activeTab = "companion";
    else if (mode === "near-you") activeTab = "near-you";
  } else if (pathname?.startsWith("/travel")) {
    activeTab = "travel";
  } else if (pathname?.startsWith("/activities")) {
    activeTab = "companion";
  }

  const navItems = [
    {
      id: "companion",
      label: "Companion",
      href: "/discover?mode=companion",
      icon: Users,
      activeBorderClass: "border-emerald-500",
      activeTextClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "travel",
      label: "Travel",
      href: "/discover?mode=travel",
      icon: Luggage,
      activeBorderClass: "border-orange-500",
      activeTextClass: "text-orange-600 dark:text-orange-400",
    },
  ];

  const isDiscoverHome = pathname === "/discover";
  const shouldHideBecauseTop = isDiscoverHome && lastScrollY < 150;
  
  // Combine scroll visibility with top-hide logic
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between sm:justify-start sm:gap-12 h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 flex-1 sm:flex-none h-full border-b-[3px] transition-all ${
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

export default PrimaryNavigation;
