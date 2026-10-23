"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ChevronRight, ChevronsRight, Check, Loader2 } from "lucide-react";

interface SwipeToJoinButtonProps {
  onJoin: () => void | Promise<void>;
  label?: string;
  successLabel?: string;
  theme?: "emerald" | "orange";
  disabled?: boolean;
  className?: string;
}

export const SwipeToJoinButton: React.FC<SwipeToJoinButtonProps> = ({
  onJoin,
  label = "Slide to Join",
  successLabel = "Confirmed!",
  theme = "emerald",
  disabled = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  const knobSize = 40; // 40px width and height
  const knobMargin = 4; // 4px margin top & left
  const maxDrag = Math.max(0, trackWidth - knobSize - knobMargin * 2);

  // Framer Motion gesture value
  const x = useMotionValue(0);

  // Glow Trail Fill width tracking the knob exactly
  const trailWidth = useTransform(x, (val) => `${val + knobSize + knobMargin}px`);

  // Text opacity: gently fades as knob slides past halfway
  const textOpacity = useTransform(x, [0, Math.max(1, maxDrag * 0.45)], [1, 0]);
  const textTranslateX = useTransform(x, [0, Math.max(1, maxDrag * 0.45)], [0, 16]);

  const themeConfig = isEmerald
    ? {
        track:
          "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/15 dark:from-emerald-950/60 dark:via-teal-950/50 dark:to-emerald-950/70 border-emerald-500/35 dark:border-emerald-600/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_2px_10px_rgba(16,185,129,0.1)]",
        glowFill:
          "bg-gradient-to-r from-emerald-500/25 via-teal-400/40 to-emerald-400/60 border-r-2 border-emerald-400/90 shadow-[0_0_15px_rgba(16,185,129,0.5)]",
        knob:
          "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 shadow-[0_6px_18px_rgba(16,185,129,0.55),inset_0_1.5px_2px_rgba(255,255,255,0.7),inset_0_-2px_3px_rgba(0,0,0,0.2)] text-white",
        textGradient:
          "from-emerald-950 via-teal-900 to-emerald-950 dark:from-emerald-100 dark:via-teal-100 dark:to-emerald-200",
        arrowColor: "text-emerald-700 dark:text-emerald-400",
      }
    : {
        track:
          "bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/15 dark:from-orange-950/60 dark:via-amber-950/50 dark:to-orange-950/70 border-orange-500/35 dark:border-orange-600/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_2px_10px_rgba(249,115,22,0.1)]",
        glowFill:
          "bg-gradient-to-r from-orange-500/25 via-amber-400/40 to-orange-400/60 border-r-2 border-orange-400/90 shadow-[0_0_15px_rgba(249,115,22,0.5)]",
        knob:
          "bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 shadow-[0_6px_18px_rgba(249,115,22,0.55),inset_0_1.5px_2px_rgba(255,255,255,0.7),inset_0_-2px_3px_rgba(0,0,0,0.2)] text-white",
        textGradient:
          "from-orange-950 via-amber-900 to-orange-950 dark:from-orange-100 dark:via-amber-100 dark:to-orange-200",
        arrowColor: "text-orange-700 dark:text-orange-400",
      };

  const handleDragEnd = useCallback(async () => {
    setIsDragging(false);
    if (disabled || isCompleted || isLoading || maxDrag <= 0) return;

    const currentX = x.get();
    // Complete if user dragged at least 75% of the track
    if (currentX >= maxDrag * 0.75) {
      // Snap smoothly to completion end
      animate(x, maxDrag, {
        type: "spring",
        stiffness: 550,
        damping: 32,
      });

      setIsCompleted(true);
      setIsLoading(true);

      try {
        await onJoin();
      } catch (err) {
        console.error("Error in onJoin slider:", err);
      } finally {
        setIsLoading(false);
        // Smooth spring return after confirmation
        setTimeout(() => {
          setIsCompleted(false);
          animate(x, 0, {
            type: "spring",
            stiffness: 420,
            damping: 30,
          });
        }, 1200);
      }
    } else {
      // Fluid spring return to start position
      animate(x, 0, {
        type: "spring",
        stiffness: 450,
        damping: 28,
      });
    }
  }, [disabled, isCompleted, isLoading, maxDrag, onJoin, x]);

  return (
    <div
      ref={containerRef}
      className={`relative h-12 flex-1 rounded-2xl border ${themeConfig.track} overflow-hidden select-none backdrop-blur-xl transition-all duration-200 ${
        disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"
      } ${className}`}
    >
      {/* Dynamic Luminous Gradient Trail behind Knob */}
      <motion.div
        className={`absolute inset-y-0 left-0 ${themeConfig.glowFill} pointer-events-none`}
        style={{ width: isCompleted ? "100%" : trailWidth }}
      />

      {/* Sweeping Shimmer Beam */}
      {!isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none animate-shimmer-sweep" />
      )}

      {/* Action Typography: Positioned with clearance so it is NEVER obscured by the knob */}
      <motion.div
        className="absolute inset-y-0 left-[48px] right-3 flex items-center justify-center pointer-events-none select-none z-0"
        style={{
          opacity: isCompleted ? 0 : textOpacity,
          x: isCompleted ? 0 : textTranslateX,
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`text-[11px] sm:text-xs font-black tracking-wider uppercase bg-gradient-to-r ${themeConfig.textGradient} bg-clip-text text-transparent truncate drop-shadow-xs`}
          >
            {label}
          </span>
          <div className="flex items-center -space-x-1.5 shrink-0">
            <ChevronsRight
              className={`w-3.5 h-3.5 animate-pulse ${themeConfig.arrowColor}`}
            />
          </div>
        </div>
      </motion.div>

      {/* Success Confirmed Label */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        >
          <span className="text-xs font-black tracking-wide text-white drop-shadow-sm uppercase">
            {successLabel}
          </span>
        </motion.div>
      )}

      {/* Tactile 3D Interactive Spring Knob */}
      <motion.div
        drag={disabled || isCompleted || isLoading ? false : "x"}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.06}
        dragMomentum={false}
        style={{ x }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        whileHover={disabled || isCompleted ? {} : { scale: 1.04 }}
        whileTap={disabled || isCompleted ? {} : { scale: 1.06 }}
        className={`absolute top-1 left-1 w-10 h-10 rounded-xl ${themeConfig.knob} flex items-center justify-center cursor-grab active:cursor-grabbing z-20 touch-none select-none`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : isCompleted ? (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 25 }}
          >
            <Check className="w-4 h-4 text-white stroke-[3.5]" />
          </motion.div>
        ) : (
          <motion.div
            animate={isDragging ? { x: 3 } : { x: [0, 2.5, 0] }}
            transition={
              isDragging
                ? { duration: 0.1 }
                : { repeat: Infinity, duration: 1.6, ease: "easeInOut" }
            }
          >
            <ChevronRight className="w-4 h-4 text-white stroke-[3]" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
