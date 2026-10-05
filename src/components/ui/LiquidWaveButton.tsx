"use client";

import React from "react";
import Link from "next/link";

interface LiquidWaveButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export const LiquidWaveButton: React.FC<LiquidWaveButtonProps> = ({
  href,
  children,
  className = "",
  size = "md",
}) => {
  const sizeClasses =
    size === "sm"
      ? "px-3.5 py-1.5 text-xs min-h-[32px]"
      : "px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-bold min-h-[36px]";

  return (
    <Link
      href={href}
      className={`liquid-bottle-btn group relative inline-flex items-center justify-center overflow-hidden rounded-full font-bold text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] ${sizeClasses} ${className}`}
      aria-label={typeof children === "string" ? children : "Button"}
    >
      {/* --- Glass Bottle Body (Outer & Inner Depth) --- */}
      <span className="liquid-glass-bottle" />

      {/* --- Liquid Chamber with Organic Ocean Waves --- */}
      <span className="liquid-fluid-chamber">
        {/* Layer 1: Deep Ocean Background Wave */}
        <span className="liquid-svg-wrapper wave-layer-back">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="liquid-svg-element">
            <defs>
              <linearGradient id="oceanBackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#047857" />
                <stop offset="50%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#0e7490" />
              </linearGradient>
            </defs>
            <path
              d="M 0,56 Q 150,36 300,56 T 600,56 Q 750,36 900,56 T 1200,56 L 1200,120 L 0,120 Z"
              fill="url(#oceanBackGrad)"
              opacity="0.8"
            />
          </svg>
        </span>

        {/* Layer 2: Mid Tropical Aqua Wave */}
        <span className="liquid-svg-wrapper wave-layer-mid">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="liquid-svg-element">
            <defs>
              <linearGradient id="oceanMidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <path
              d="M 0,48 Q 150,64 300,48 T 600,48 Q 750,64 900,48 T 1200,48 L 1200,120 L 0,120 Z"
              fill="url(#oceanMidGrad)"
              opacity="0.9"
            />
          </svg>
        </span>

        {/* Layer 3: Front Sea Crest Wave with Foam Shoreline */}
        <span className="liquid-svg-wrapper wave-layer-front">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="liquid-svg-element">
            <defs>
              <linearGradient id="oceanFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="45%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            {/* Wave Body */}
            <path
              d="M 0,38 Q 150,22 300,38 T 600,38 Q 750,22 900,38 T 1200,38 L 1200,120 L 0,120 Z"
              fill="url(#oceanFrontGrad)"
              opacity="0.98"
            />
            {/* White Foam Crest Line */}
            <path
              d="M 0,38 Q 150,22 300,38 T 600,38 Q 750,22 900,38 T 1200,38"
              fill="none"
              stroke="rgba(255, 255, 255, 0.95)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </span>

        {/* Floating Water Bubbles inside bottle */}
        <span className="liquid-bubble b1" />
        <span className="liquid-bubble b2" />
        <span className="liquid-bubble b3" />
        <span className="liquid-bubble b4" />
        <span className="liquid-bubble b5" />
      </span>

      {/* --- Glass Bottle Specular Reflection Highlights (Top & Bottom curves) --- */}
      <span className="liquid-glass-specular-top" />
      <span className="liquid-glass-specular-bottom" />

      {/* --- Button Content / Label --- */}
      <span className="relative z-30 flex items-center justify-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        {children}
      </span>
    </Link>
  );
};

