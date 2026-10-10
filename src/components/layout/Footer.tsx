"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
} from "lucide-react";

interface FooterProps {
  initialUser?: any;
}

const Footer: React.FC<FooterProps> = () => {
  const pathname = usePathname();



  // Mouse tracking state for the dynamic torch beam
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredLetter, setHoveredLetter] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const brandLetters = [
    { char: "T", gradient: "linear-gradient(180deg, #ffedd5 0%, #fb923c 25%, #f97316 65%, #ea580c 100%)", glow: "rgba(249, 115, 22, " },
    { char: "R", gradient: "linear-gradient(180deg, #ffedd5 0%, #fb923c 25%, #f97316 65%, #ea580c 100%)", glow: "rgba(249, 115, 22, " },
    { char: "A", gradient: "linear-gradient(180deg, #ffedd5 0%, #fb923c 25%, #f97316 65%, #ea580c 100%)", glow: "rgba(249, 115, 22, " },
    { char: "V", gradient: "linear-gradient(180deg, #ffedd5 0%, #fb923c 20%, #f59e0b 55%, #10b981 100%)", glow: "rgba(245, 158, 11, " },
    { char: "A", gradient: "linear-gradient(180deg, #ecfdf5 0%, #f59e0b 20%, #34d399 55%, #059669 100%)", glow: "rgba(52, 211, 153, " },
    { char: "L", gradient: "linear-gradient(180deg, #ecfdf5 0%, #6ee7b7 25%, #10b981 65%, #047857 100%)", glow: "rgba(16, 185, 129, " },
    { char: "L", gradient: "linear-gradient(180deg, #ecfdf5 0%, #6ee7b7 25%, #10b981 65%, #047857 100%)", glow: "rgba(16, 185, 129, " },
    { char: "Y", gradient: "linear-gradient(180deg, #ecfdf5 0%, #6ee7b7 25%, #10b981 65%, #047857 100%)", glow: "rgba(16, 185, 129, " },
  ];

  // Ambient torch wandering when the mouse is idle
  useEffect(() => {
    if (isHovered) return;
    let angle = 0;
    const interval = setInterval(() => {
      angle += 0.025;
      const x = 50 + Math.sin(angle) * 35;
      const y = 50 + Math.cos(angle * 1.6) * 20;
      setMousePos({ x, y });
    }, 40);
    return () => clearInterval(interval);
  }, [isHovered]);

  // 1. Hide inside chat rooms, auth pages, and onboarding
  if (
    (pathname?.startsWith("/chats/") && pathname !== "/chats") ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname?.startsWith("/onboarding")
  ) {
    return null;
  }

  // 2. Hide on internal in-app pages, but ALWAYS show on landing page
  if (pathname !== "/") {
    return null;
  }



  // Handle smooth mouse move tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
    setIsHovered(true);
  };

  return (
    <footer className="bg-[#050806] text-slate-300 text-xs border-t border-emerald-950/70 pb-16 pt-6 transition-colors overflow-hidden relative select-none">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-orange-500/10 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">


        {/* Legal Notice */}
        <div className="pt-8 border-t border-emerald-950/60 text-xs leading-relaxed text-slate-400 space-y-3">
          <p>
            <strong className="text-white font-bold">Safety &amp; Real-World Meeting Notice:</strong> Travally is a free social companion and travel planning discovery network facilitating introductions between solo explorers with shared passions. Always prioritize personal safety: meet only in well-lit public places, never share financial details, verify your companion&apos;s identity on video or public profile prior to multi-day trips, and inform trusted contacts of your plans. Travally is not a commercial travel agency, tour operator, or paid companion service.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-3 text-slate-400 text-[11px]">
            <span>© {new Date().getFullYear()} Travally Technologies India. All rights reserved. Free social discovery for India.</span>
            <div className="flex items-center gap-5">
              <Link href="/safety#terms" className="hover:text-emerald-400 transition">Terms</Link>
              <Link href="/safety#privacy" className="hover:text-emerald-400 transition">Privacy</Link>
              <Link href="/safety" className="hover:text-emerald-400 transition">Safety Center</Link>
            </div>
          </div>
        </div>

        {/* ── 🔦 THE TORCH-LIT TRAVALLY WORDMARK WITH ILLUMINATED PATH & COMPANIONS ── */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="mt-14 pt-8 border-t border-white/[0.08] relative overflow-hidden rounded-3xl cursor-default transition-all duration-300"
          style={{
            background: "radial-gradient(ellipse at 50% 100%, rgba(249, 115, 22, 0.08) 0%, rgba(16, 185, 129, 0.06) 50%, rgba(5, 8, 6, 0.98) 75%), #030504",
          }}
        >
          {/* Dynamic Follower Torch Spotlight Beam with Travally Orange-Emerald Hues */}
          <div
            className="absolute pointer-events-none transition-transform duration-75 ease-out"
            style={{
              left: `${mousePos.x}%`,
              top: `${mousePos.y}%`,
              transform: "translate(-50%, -50%)",
              width: "600px",
              height: "600px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(249, 115, 22, 0.28) 0%, rgba(245, 158, 11, 0.18) 30%, rgba(16, 185, 129, 0.14) 55%, transparent 75%)",
              filter: "blur(32px)",
              opacity: isHovered ? 0.95 : 0.7,
            }}
          />

          <div className="relative z-10 text-center px-4 pt-4 pb-4 space-y-4">
            {/* ── THE TRAVALLY WORDMARK: PRECISE LOGO ORANGE & EMERALD GRADIENTS ── */}
            <div className="flex items-center justify-center gap-1 sm:gap-2.5 md:gap-4 tracking-tighter">
              {brandLetters.map((item, idx) => {
                const isLetterHovered = hoveredLetter === idx;
                const letterPosPercent = (idx / (brandLetters.length - 1)) * 100;
                const distFromMouse = Math.abs(mousePos.x - letterPosPercent);
                const proximityGlow = Math.max(0, 1 - distFromMouse / 35);

                return (
                  <span
                    key={idx}
                    onMouseEnter={() => setHoveredLetter(idx)}
                    onMouseLeave={() => setHoveredLetter(null)}
                    className={`font-black uppercase inline-block text-5xl sm:text-7xl md:text-8xl lg:text-9xl select-none transition-all duration-300 transform-gpu cursor-pointer ${
                      isLetterHovered
                        ? `scale-110 -translate-y-2 brightness-135 drop-shadow-[0_0_40px_${item.glow}0.95)]`
                        : ""
                    }`}
                    style={{
                      background: item.gradient,
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      color: "transparent",
                      filter: `drop-shadow(0 0 ${12 + proximityGlow * 28}px ${item.glow}${0.4 + proximityGlow * 0.55}))`,
                      transform: isLetterHovered ? "translateY(-6px) scale(1.08)" : `scale(${1 + proximityGlow * 0.04})`,
                    }}
                  >
                    {item.char}
                  </span>
                );
              })}
            </div>

            {/* ── THE LIGHT WAY WITH TWO COMPANIONS VISIBLE WALKING THE ILLUMINATED PATH ── */}
            <div className="relative w-full max-w-4xl mx-auto h-32 sm:h-36 overflow-hidden">
              <svg
                viewBox="0 0 900 140"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <defs>
                  {/* Torch Light Cone Radial Beam matching Travally Orange-to-Emerald palette */}
                  <radialGradient id="torchCone" cx="50%" cy="0%" r="90%">
                    <stop offset="0%" stopColor="#ffedd5" stopOpacity="0.9" />
                    <stop offset="25%" stopColor="#f97316" stopOpacity="0.45" />
                    <stop offset="65%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#050806" stopOpacity="0" />
                  </radialGradient>

                  {/* Winding Trail Path Gradient: Left Orange ("Tra"), Transition Center ("va"), Right Emerald ("lly") */}
                  <linearGradient id="trailGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                    <stop offset="35%" stopColor="#f97316" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
                    <stop offset="65%" stopColor="#34d399" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                  </linearGradient>

                  <filter id="softGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* 1. Volumetric Light Cone projecting onto the landscape */}
                <polygon
                  points={`450,0 ${mousePos.x * 9 - 180},140 ${mousePos.x * 9 + 180},140`}
                  fill="url(#torchCone)"
                  className="transition-all duration-150 ease-out opacity-75"
                />

                {/* 2. The Light Way (Winding Mountain Path showing the route ahead in Travally brand gradient) */}
                <path
                  d="M 50 135 C 250 130 380 95 450 75 C 520 55 680 90 850 130"
                  stroke="url(#trailGlow)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                  className="opacity-90"
                />
                <path
                  d="M 120 138 C 300 132 400 98 450 78 C 500 58 640 92 780 132"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeDasharray="4 8"
                  className="opacity-60"
                />

                {/* 3. The Torch Lamp Head at the source */}
                <g transform="translate(436, -5)">
                  <path d="M 14 0 L 6 22 L 22 22 Z" fill="#f97316" />
                  <circle cx="14" cy="8" r="7" fill="#fed7aa" filter="url(#softGlow)" />
                  <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                </g>

                {/* 4. Two Companions Walking Side-by-Side: Companion 1 in Orange ("Tra"), Companion 2 in Emerald ("lly") */}
                <g
                  transform="translate(425, 46)"
                  className="transition-transform duration-300"
                  style={{
                    filter: "drop-shadow(0 0 10px rgba(249, 115, 22, 0.8))",
                  }}
                >
                  {/* Companion 1 (Left Explorer in Travally Orange tones) */}
                  <g className="companion-one">
                    {/* Head */}
                    <circle cx="14" cy="6" r="3.2" fill="#fff7ed" />
                    {/* Torso & Backpack */}
                    <path d="M 12 9.5 L 16 9.5 L 17 22 L 11 22 Z" fill="#fb923c" />
                    {/* Backpack on shoulders */}
                    <rect x="7" y="11" width="5" height="9" rx="1.5" fill="#ea580c" />
                    {/* Legs walking forward */}
                    <line x1="12" y1="22" x2="10" y2="33" stroke="#fff7ed" strokeWidth="2.4" strokeLinecap="round" />
                    <line x1="16" y1="22" x2="18" y2="32" stroke="#f97316" strokeWidth="2.4" strokeLinecap="round" />
                    {/* Trekking pole in hand */}
                    <line x1="16" y1="16" x2="22" y2="33" stroke="#fdba74" strokeWidth="1.2" strokeLinecap="round" />
                  </g>

                  {/* Companion 2 (Right Explorer in Travally Emerald tones) */}
                  <g className="companion-two" transform="translate(18, 1)">
                    {/* Head */}
                    <circle cx="14" cy="6" r="3.2" fill="#ecfdf5" />
                    {/* Torso & Backpack */}
                    <path d="M 12 9.5 L 16 9.5 L 17 22 L 11 22 Z" fill="#34d399" />
                    {/* Backpack */}
                    <rect x="7" y="11" width="5" height="9" rx="1.5" fill="#059669" />
                    {/* Arm pointing forward along the path */}
                    <line x1="16" y1="13" x2="24" y2="10" stroke="#ecfdf5" strokeWidth="1.8" strokeLinecap="round" />
                    {/* Legs in walking stride */}
                    <line x1="12" y1="22" x2="9" y2="32" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" />
                    <line x1="16" y1="22" x2="19" y2="33" stroke="#ecfdf5" strokeWidth="2.4" strokeLinecap="round" />
                  </g>
                </g>

                {/* Subtle starlight particles drifting along the illuminated trail */}
                <circle cx="280" cy="40" r="1.5" fill="#fb923c" className="animate-ping opacity-60" />
                <circle cx="620" cy="30" r="1.5" fill="#34d399" className="animate-ping opacity-70" />
                <circle cx="370" cy="70" r="1.2" fill="#ffffff" className="opacity-80" />
                <circle cx="530" cy="65" r="1.2" fill="#a7f3d0" className="opacity-80" />
              </svg>
            </div>
            {/* ABSOLUTELY NOTHING AFTER THIS - AS EXPLICITLY REQUESTED */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
