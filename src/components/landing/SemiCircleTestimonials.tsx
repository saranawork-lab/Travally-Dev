"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Star,
  ShieldCheck,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface TestimonialItem {
  name: string;
  avatarUrl?: string;
  city: string;
  role: string;
  quote: string;
  badge: string;
  type: string;
  rating?: number;
  activityTitle?: string;
}

interface SemiCircleTestimonialsProps {
  testimonials: TestimonialItem[];
}

export function SemiCircleTestimonials({ testimonials }: SemiCircleTestimonialsProps) {
  const [offset, setOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Compact Modern Geometry: 290px card + 16px gap = 306px per item
  const CARD_WIDTH = 290;
  const GAP = 16;
  const ITEM_WIDTH = CARD_WIDTH + GAP;
  const HALF_WIDTH = ITEM_WIDTH * testimonials.length;
  const SPEED = 40; // Silky smooth conveyor speed

  // Duplicate items for seamless continuous looping
  const displayItems = [...testimonials, ...testimonials];

  const animate = useCallback(
    (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (!isPaused && HALF_WIDTH > 0) {
        setOffset((prev) => {
          const next = prev + (SPEED * delta) / 1000;
          return next >= HALF_WIDTH ? next - HALF_WIDTH : next;
        });
      }

      animRef.current = requestAnimationFrame(animate);
    },
    [isPaused, HALF_WIDTH]
  );

  useEffect(() => {
    lastTimeRef.current = 0;
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [animate]);

  const handlePrev = () => {
    setOffset((prev) => (prev - ITEM_WIDTH + HALF_WIDTH) % HALF_WIDTH);
  };

  const handleNext = () => {
    setOffset((prev) => (prev + ITEM_WIDTH) % HALF_WIDTH);
  };

  return (
    <div
      className="relative w-full overflow-hidden select-none py-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Subtle ambient lighting - desktop only */}
      <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-32 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Edge gradient fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-r from-white via-white/80 dark:from-[#090d0b] dark:via-[#090d0b]/80 to-transparent z-20 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-l from-white via-white/80 dark:from-[#090d0b] dark:via-[#090d0b]/80 to-transparent z-20 pointer-events-none" />

      {/* Floating Controls */}
      <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 hidden sm:flex">
        <button
          onClick={handlePrev}
          type="button"
          aria-label="Previous review"
          className="w-8 h-8 rounded-full bg-white/90 dark:bg-[#121915]/90 backdrop-blur-md border border-slate-200/90 dark:border-emerald-900/60 shadow-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-110 hover:border-emerald-500 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 hidden sm:flex">
        <button
          onClick={handleNext}
          type="button"
          aria-label="Next review"
          className="w-8 h-8 rounded-full bg-white/90 dark:bg-[#121915]/90 backdrop-blur-md border border-slate-200/90 dark:border-emerald-900/60 shadow-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-110 hover:border-emerald-500 transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Marquee Track */}
      <div className="w-full flex items-center py-3">
        <div
          className="flex items-stretch gap-4 transition-transform ease-linear duration-75"
          style={{
            transform: `translate3d(-${offset}px, 0, 0)`,
            willChange: "transform",
          }}
        >
          {displayItems.map((t, idx) => (
            <div
              key={idx}
              className={`
                w-[280px] sm:w-[290px] shrink-0
                p-4 rounded-2xl
                bg-white dark:bg-[#0d1511]
                border border-slate-200/80 dark:border-emerald-950/70
                shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)]
                transition-all duration-300 transform-gpu
                hover:-translate-y-1 hover:border-emerald-500/50
                hover:shadow-[0_12px_28px_rgba(16,185,129,0.14)]
                flex flex-col gap-2.5
                relative overflow-hidden group
              `}
            >
              {/* Top Accent Gradient Border */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  t.type === "Travel Expedition"
                    ? "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400"
                    : "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400"
                }`}
              />

              {/* Upper Section: Author info + Star Rating */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {t.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {t.city} • {t.role.split(" ")[0]}
                  </p>
                </div>

                {/* Dynamic Star Rating */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const isFilled = s <= (t.rating ?? 5);
                    return (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          isFilled
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-200 dark:fill-slate-800 text-slate-300 dark:text-slate-700"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Quote - Fits fully without truncation */}
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic font-normal px-0.5">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
