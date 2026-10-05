"use client";

import React, { useState, useEffect } from "react";

export interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
  variant?: "full" | "icon";
  themeVariant?: "auto" | "light" | "dark";
  animate?: boolean;
  animateType?: "smooth" | "stay";
  revealAnimation?: boolean;
}

/**
 * Travally Brand Emblem:
 * Four-leaf compass flora with cardinal waypoints and warm golden sunrise beacon.
 * Features a periodic wheel spin like a chakra in place, without wobble.
 * High-contrast rendering for both pristine light mode and radiant dark mode.
 */
export const LogoMark: React.FC<{
  size?: number;
  className?: string;
  animate?: boolean;
  animateType?: "smooth" | "stay";
  themeVariant?: "auto" | "light" | "dark";
}> = ({
  size = 36,
  className = "",
  animate = true,
  animateType = "stay",
  themeVariant = "auto",
}) => {
    const animClass = animate
      ? animateType === "smooth"
        ? "animate-spin-smooth"
        : "animate-spin-stay"
      : "!animate-none !transform-none";

    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 select-none filter drop-shadow-[0_0_8px_rgba(16,185,129,0.25)] dark:drop-shadow-[0_0_12px_rgba(52,211,153,0.35)] transition-all duration-300 ${className}`}
        style={{ width: size, height: size }}
        aria-label="Travally Logo"
      >
        {/* Light Mode Logo */}
        <img
          src="/brand-logo.png"
          alt="Travally Logo"
          width={size}
          height={size}
          className={`w-full h-full object-contain block transition-transform duration-300 ${themeVariant === "auto"
              ? "dark:hidden"
              : themeVariant === "dark"
                ? "hidden"
                : "block"
            } ${animate ? "group-hover:scale-105" : ""} ${animClass}`}
          style={{
            transformOrigin: "center center",
          }}
        />

        {/* Dark Mode Logo */}
        <img
          src="/brand-logo-dark.png"
          alt="Travally Logo"
          width={size}
          height={size}
          className={`w-full h-full object-contain block transition-transform duration-300 ${themeVariant === "auto"
              ? "hidden dark:block"
              : themeVariant === "light"
                ? "hidden"
                : "block"
            } ${animate ? "group-hover:scale-105" : ""} ${animClass}`}
          style={{
            transformOrigin: "center center",
          }}
        />
      </div>
    );
  };

export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = 36,
  showText = true,
  textClassName = "text-xl font-black tracking-tight",
  variant = "full",
  themeVariant = "auto",
  animate = true,
  animateType = "stay",
  revealAnimation = false,
}) => {
  const [isSettled, setIsSettled] = useState<boolean>(!revealAnimation);
  const [animKey, setAnimKey] = useState<number>(0);

  useEffect(() => {
    if (!revealAnimation) {
      setIsSettled(true);
      return;
    }

    // Check reduced motion accessibility
    if (typeof window !== "undefined") {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setIsSettled(true);
        return;
      }
    }

    // Trigger animation on mount (runs on every page refresh)
    setIsSettled(false);
    setAnimKey((prev) => prev + 1);

    const timer = setTimeout(() => {
      setIsSettled(true);
    }, 1350);

    return () => clearTimeout(timer);
  }, [revealAnimation]);

  const LETTERS = [
    { char: "T", color: "text-orange-500 dark:text-orange-400" },
    { char: "r", color: "text-orange-500 dark:text-orange-400" },
    { char: "a", color: "text-orange-500 dark:text-orange-400" },
    {
      char: "v",
      style: {
        backgroundImage: "linear-gradient(to right, #f97316 0%, #52ab4e 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      },
      className: "bg-clip-text text-transparent inline",
    },
    {
      char: "a",
      style: {
        backgroundImage: "linear-gradient(to right, #52ab4e 0%, #10b981 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      },
      className: "bg-clip-text text-transparent inline",
    },
    { char: "l", color: "text-emerald-600 dark:text-emerald-400" },
    { char: "l", color: "text-emerald-600 dark:text-emerald-400" },
    { char: "y", color: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none group transition-opacity duration-300 ${className}`}
      aria-label="Travally"
    >
      {/* ── 1. The Travally Compass Emblem with Aurora Glow ── */}
      <div className="relative inline-flex items-center justify-center">
        {/* Ambient sunrise aurora halo on entrance */}
        {revealAnimation && !isSettled && (
          <div
            className="absolute inset-0 -m-1 rounded-full bg-gradient-to-tr from-orange-500/30 via-emerald-500/20 to-amber-400/30 blur-sm pointer-events-none"
            style={{
              animation: "travallyAuroraPulse 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          />
        )}
        <LogoMark
          size={size}
          animate={animate}
          animateType={animateType}
          themeVariant={themeVariant}
        />
      </div>

      {/* ── 2. Brand Typography with Luxury Shimmer & Letter Cascade ── */}
      {showText && variant === "full" && (
        <div className="relative inline-flex flex-col justify-center">
          {revealAnimation && !isSettled ? (
            <div key={animKey} className="relative inline-flex flex-col justify-center overflow-visible">
              {/* Sequential Letter-by-Letter Floating Entrance */}
              <div className={`flex items-center tracking-tight font-black select-none ${textClassName}`}>
                {LETTERS.map((item, idx) => (
                  <span
                    key={idx}
                    className={`inline-block ${item.color || item.className || ""}`}
                    style={{
                      ...item.style,
                      animation: "travallyLetterFloatIn 0.42s cubic-bezier(0.2, 0.8, 0.2, 1) both",
                      animationDelay: `${idx * 48}ms`,
                    }}
                  >
                    {item.char}
                  </span>
                ))}
              </div>

              {/* Luminous Light Sweep Across Typography */}
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{
                  maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                  WebkitMaskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                }}
              >
                <div
                  className="w-[30%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg]"
                  style={{
                    animation: "travallyLightSweep 0.8s cubic-bezier(0.25, 1, 0.5, 1) 0.45s forwards",
                  }}
                />
              </div>

              {/* Minimalist Horizon Travel Trail Underline & Waypoint Spark */}
              <div className="absolute -bottom-1 left-0 right-0 h-[1.5px] pointer-events-none overflow-visible">
                {/* Slim Gradient Laser Trail */}
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                  style={{
                    animation: "travallyLaserTrail 0.85s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
                  }}
                />
                {/* Radiant Waypoint Spark */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_6px_#34d399] border border-white"
                  style={{
                    animation: "travallySparkGlider 0.85s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
                  }}
                />
              </div>
            </div>
          ) : (
            /* Canonical Static Brand Typography */
            <div className={`flex items-center tracking-tight font-black select-none ${textClassName}`}>
              <span className="text-orange-500 dark:text-orange-400">Tra</span>
              <span
                className="bg-gradient-to-r from-orange-500 to-emerald-500 dark:from-orange-400 dark:to-emerald-400 bg-clip-text text-transparent inline"
                style={{
                  backgroundImage: "linear-gradient(to right, #f97316 0%, #10b981 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                va
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">lly</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

