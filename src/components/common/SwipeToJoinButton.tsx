"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Navigation, Check, Loader2, Sparkles, ChevronsRight } from "lucide-react";

interface SwipeToJoinButtonProps {
  onJoin: () => void | Promise<void>;
  label?: string;
  successLabel?: string;
  theme?: "emerald" | "orange" | "travally";
  disabled?: boolean;
  className?: string;
}

export const SwipeToJoinButton: React.FC<SwipeToJoinButtonProps> = ({
  onJoin,
  label = "Slide to Join",
  successLabel = "Request Sent",
  theme = "travally",
  disabled = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPastThreshold, setIsPastThreshold] = useState(false);

  const isEmerald = theme === "emerald";

  // Measure dynamic width of container with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setTrackWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const knobSize = 42;
  const knobMargin = 4;
  const maxDrag = Math.max(0, trackWidth - knobSize - knobMargin * 2);

  // Framer Motion gesture value
  const x = useMotionValue(0);

  // Smooth trail width (liquid glow following the knob seamlessly)
  const trailWidth = useTransform(x, (val) => `${val + knobSize + knobMargin}px`);

  // Knob rotation: spins the compass arrow as you slide forward (45deg -> 225deg)
  const compassRotation = useTransform(x, [0, Math.max(1, maxDrag)], [45, 225]);

  // ── EQUAL 3-STAGE COLOR PROGRESSION: 1/3 ORANGE -> 1/3 IN-BETWEEN GRADIENT -> 1/3 GREEN ──
  // 1. First Orange Layer (dominant 0% -> 35%, then blends into gradient)
  const orangeLayerOpacity = useTransform(
    x,
    [0, Math.max(1, maxDrag * 0.35)],
    [1, 0]
  );

  // 2. In-Between Amber/Gold Gradient Layer (peaks right in the middle 35% -> 65%)
  const gradientLayerOpacity = useTransform(
    x,
    [0, Math.max(1, maxDrag * 0.25), Math.max(1, maxDrag * 0.5), Math.max(1, maxDrag * 0.75)],
    [0, 1, 1, 0]
  );

  // 3. At Last Green Layer (emerges at 65% -> fully green for final 35%)
  const greenLayerOpacity = useTransform(
    x,
    [Math.max(1, maxDrag * 0.55), Math.max(1, maxDrag * 0.85)],
    [0, 1]
  );

  // Dynamic Knob Aura: interpolates glow color equally across Orange -> Amber -> Green (softened by extra 25%)
  const knobAuraColor = useTransform(
    x,
    [0, Math.max(1, maxDrag * 0.5), Math.max(1, maxDrag)],
    isEmerald
      ? [
          "rgba(16, 185, 129, 0.45)",
          "rgba(20, 184, 166, 0.45)",
          "rgba(16, 185, 129, 0.55)",
        ]
      : [
          "rgba(249, 115, 22, 0.36)", // Extra softened Orange aura
          "rgba(245, 158, 11, 0.39)", // Extra softened Amber/Gradient aura
          "rgba(16, 185, 129, 0.45)", // Extra softened Green aura
        ]
  );

  // Trail opacity based on progress
  const trailOpacity = useTransform(x, [0, Math.max(1, maxDrag * 0.1), Math.max(1, maxDrag)], [0.45, 0.8, 1]);

  // Text transitions
  const startTextOpacity = useTransform(x, [0, Math.max(1, maxDrag * 0.35)], [1, 0]);
  const textTranslateX = useTransform(x, [0, Math.max(1, maxDrag * 0.35)], [0, 20]);

  // Revealed end text ("Request Sent") fades in smoothly as knob slides past halfway
  const endTextOpacity = useTransform(
    x,
    [Math.max(1, maxDrag * 0.38), Math.max(1, maxDrag * 0.68)],
    [0, 1]
  );

  // Monitor drag threshold in real-time
  useEffect(() => {
    const unsubscribe = x.on("change", (latest) => {
      if (maxDrag > 0) {
        setIsPastThreshold(latest >= maxDrag * 0.75);
      }
    });
    return () => unsubscribe();
  }, [maxDrag, x]);

  const handleDragEnd = useCallback(async () => {
    setIsDragging(false);
    if (disabled || isCompleted || isLoading || maxDrag <= 0) return;

    const currentX = x.get();
    if (currentX >= maxDrag * 0.75) {
      // Snap to green destination
      animate(x, maxDrag, {
        type: "spring",
        stiffness: 500,
        damping: 30,
      });

      setIsCompleted(true);
      setIsLoading(true);

      try {
        await onJoin();
      } catch (err) {
        console.error("Error in onJoin slider:", err);
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          setIsCompleted(false);
          setIsPastThreshold(false);
          animate(x, 0, {
            type: "spring",
            stiffness: 420,
            damping: 28,
          });
        }, 1200);
      }
    } else {
      // Spring back to orange start position
      animate(x, 0, {
        type: "spring",
        stiffness: 450,
        damping: 26,
      });
    }
  }, [disabled, isCompleted, isLoading, maxDrag, onJoin, x]);

  return (
    <div
      ref={containerRef}
      className={`relative h-[50px] flex-1 rounded-full border ${
        isEmerald
          ? "border-emerald-500/25 bg-[linear-gradient(to_right,rgba(16,185,129,0.08)_0%,rgba(20,184,166,0.06)_50%,rgba(16,185,129,0.12)_100%)] dark:bg-[linear-gradient(to_right,rgba(6,78,59,0.4)_0%,rgba(19,78,74,0.3)_50%,rgba(6,78,59,0.45)_100%)] shadow-[inset_0_2px_6px_rgba(0,0,0,0.06),0_4px_16px_rgba(16,185,129,0.12)]"
          : "border-orange-400/25 dark:border-emerald-500/25 bg-[linear-gradient(to_right,rgba(249,115,22,0.08)_0%,rgba(245,158,11,0.06)_50%,rgba(16,185,129,0.08)_100%)] dark:bg-[linear-gradient(to_right,rgba(154,52,18,0.4)_0%,rgba(120,53,15,0.3)_50%,rgba(6,78,59,0.4)_100%)] shadow-[inset_0_2px_6px_rgba(0,0,0,0.06),0_4px_16px_rgba(249,115,22,0.1)]"
      } overflow-hidden select-none backdrop-blur-xl transition-all duration-300 ${
        disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"
      } ${className}`}
    >
      {/* ── 1. EQUALLY BALANCED LIQUID NEON TRAIL (33% Orange -> 33% Amber -> 33% Green) ── */}
      <motion.div
        className={`absolute inset-y-0 left-0 ${
          isEmerald
            ? "bg-[linear-gradient(to_right,#059669_0%,#10b981_50%,#14b8a6_100%)]"
            : "bg-[linear-gradient(to_right,#f97316_0%,#fb923c_25%,#f59e0b_50%,#10b981_75%,#059669_100%)]"
        } pointer-events-none rounded-full`}
        style={{
          width: isCompleted ? "100%" : trailWidth,
          opacity: isCompleted ? 1 : trailOpacity,
        }}
      >
        {/* Soft liquid feather edge following knob */}
        <div className="absolute top-0 bottom-0 right-0 w-6 bg-gradient-to-r from-transparent to-white/25 blur-xs" />
      </motion.div>

      {/* ── 2. SHIMMER LIGHT BEAM PASSING ACROSS TRACK ── */}
      {!isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent -translate-x-full animate-[shimmerSweep_2.8s_ease-in-out_infinite] pointer-events-none" />
      )}

      {/* ── 3A. START INSTRUCTION TEXT ("Slide to Join ››") ── */}
      <motion.div
        className="absolute inset-y-0 left-[52px] right-6 flex items-center justify-center pointer-events-none select-none z-10"
        style={{
          opacity: isCompleted ? 0 : startTextOpacity,
          x: textTranslateX,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-[11.5px] sm:text-xs font-black tracking-wider uppercase ${
              isEmerald
                ? "text-emerald-700 dark:text-emerald-300"
                : "bg-[linear-gradient(to_right,#ea580c_0%,#d97706_50%,#059669_100%)] dark:bg-[linear-gradient(to_right,#fb923c_0%,#fcd34d_50%,#34d399_100%)] bg-clip-text text-transparent"
            } drop-shadow-xs`}
          >
            {label}
          </span>

          {/* Single-color clean chevrons */}
          <ChevronsRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
        </div>
      </motion.div>

      {/* ── 3B. REVEALED TRACK TEXT ("Request Sent") WHEN SLIDING / AT DESTINATION ── */}
      <motion.div
        className="absolute inset-y-0 left-4 right-[52px] flex items-center justify-center pointer-events-none select-none z-10"
        style={{
          opacity: isCompleted ? 0 : endTextOpacity,
        }}
      >
        <span className="text-[11.5px] sm:text-xs font-black tracking-wider uppercase text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.5)]">
          Request Sent
        </span>
      </motion.div>

      {/* ── 4. SUCCESS CONFIRMED STATE (TRIUMPHANT AT LAST GREEN) ── */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 flex items-center justify-center pointer-events-none z-10 gap-1.5 shadow-[0_0_30px_rgba(16,185,129,0.7)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-white animate-spin" style={{ animationDuration: "3s" }} />
          <span className="text-xs font-black tracking-wider text-white drop-shadow-md uppercase">
            Request Sent
          </span>
        </motion.div>
      )}

      {/* ── 5. THE ORBITAL COMPASS DIAL (DYNAMIC EQUAL 3-STAGE COLOR MORPHING KNOB) ── */}
      <motion.div
        drag={disabled || isCompleted || isLoading ? false : "x"}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.08}
        dragMomentum={false}
        style={{ x }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        whileHover={disabled || isCompleted ? {} : { scale: 1.04 }}
        whileTap={disabled || isCompleted ? {} : { scale: 1.06 }}
        className="absolute top-1 left-1 w-[42px] h-[42px] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-20 touch-none select-none shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.32),inset_0_-2px_4px_rgba(0,0,0,0.18)]"
      >
        {/* Dynamic Multi-Color Ambient Glow Aura (softened by extra 25%) */}
        <motion.div
          className="absolute -inset-1 rounded-full blur-md pointer-events-none transition-transform duration-200"
          style={{
            backgroundColor: knobAuraColor,
            scale: isDragging || isPastThreshold ? 1.1 : 1.0,
          }}
        />

        {/* ── LAYER A: FIRST LAYER (Orange for Travel, Emerald for Companion) ── */}
        <motion.div
          className={`absolute inset-0 rounded-full ${
            isEmerald
              ? "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
              : "bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 shadow-[0_2px_8px_rgba(249,115,22,0.3)]"
          }`}
          style={{ opacity: orangeLayerOpacity }}
        />

        {/* ── LAYER B: IN-BETWEEN GRADIENT LAYER ── */}
        <motion.div
          className={`absolute inset-0 rounded-full ${
            isEmerald
              ? "bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
              : "bg-[linear-gradient(135deg,#f97316_0%,#f59e0b_50%,#10b981_100%)] shadow-[0_2px_8px_rgba(245,158,11,0.3)]"
          }`}
          style={{ opacity: gradientLayerOpacity }}
        />

        {/* ── LAYER C: AT THE LAST GREEN (100% visible at completion/end) ── */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 shadow-[0_2px_8px_rgba(16,185,129,0.35)]"
          style={{ opacity: isCompleted ? 1 : greenLayerOpacity }}
        />

        {/* Specular glass reflection ring - softened by extra 25% */}
        <div className="absolute inset-[1.5px] rounded-full border border-white/25 pointer-events-none z-10" />

        {/* Knob Content: Loader / Check / Rotating Compass Navigation Arrow */}
        <div className="relative z-20 flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white drop-shadow" />
          ) : isCompleted ? (
            <motion.div
              initial={{ scale: 0, rotate: -60 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 650, damping: 22 }}
            >
              <Check className="w-4 h-4 text-white stroke-[3.5] drop-shadow" />
            </motion.div>
          ) : (
            <motion.div
              style={{ rotate: compassRotation }}
              className="flex items-center justify-center"
            >
              <Navigation className="w-4 h-4 text-white fill-white/40 stroke-[2.5] drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
