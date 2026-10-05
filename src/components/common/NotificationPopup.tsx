"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Info, X, Flame, ArrowRight } from "lucide-react";

export interface NotificationPopupProps {
  show: boolean;
  type?: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
  onClose: () => void;
  duration?: number; // auto-dismiss in ms (default 5000, 0 for sticky)
  actionLabel?: string;
  actionHref?: string;
  position?: "top-center" | "bottom-right";
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  show,
  type = "success",
  title,
  message,
  onClose,
  duration = 5000,
  actionLabel,
  actionHref,
  position = "top-center",
}) => {
  const [visible, setVisible] = useState(show);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setAnimatingOut(false);
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      handleClose();
    }
  }, [show, duration]);

  const handleClose = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      setVisible(false);
      setAnimatingOut(false);
      onClose();
    }, 250);
  };

  if (!visible) return null;

  const isSuccess = type === "success";
  const isError = type === "error";
  const isWarning = type === "warning";
  const isBottomRight = position === "bottom-right";

  return (
    <div
      role="alert"
      className={
        isBottomRight
          ? "fixed bottom-5 right-3 sm:bottom-6 sm:right-6 z-[9999] w-[94%] sm:w-auto max-w-md pointer-events-auto"
          : "fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[94%] max-w-lg pointer-events-auto"
      }
    >
      <div
        className={`flex items-start sm:items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 transform-gpu ${
          animatingOut
            ? isBottomRight
              ? "opacity-0 translate-y-4 scale-95"
              : "opacity-0 -translate-y-4 scale-95"
            : "opacity-100 translate-y-0 scale-100"
        } ${

          isSuccess
            ? "bg-emerald-50/95 dark:bg-[#071f15]/95 border-emerald-300/90 dark:border-emerald-700/70 text-emerald-950 dark:text-emerald-50 shadow-emerald-900/10"
            : isError
            ? "bg-rose-50/95 dark:bg-[#200b0e]/95 border-rose-300 dark:border-rose-700/70 text-rose-950 dark:text-rose-50 shadow-rose-900/10"
            : isWarning
            ? "bg-amber-50/95 dark:bg-[#1a1205]/95 border-amber-300/90 dark:border-amber-600/70 text-amber-950 dark:text-amber-50 shadow-amber-900/15"
            : "bg-slate-50/95 dark:bg-[#0f172a]/95 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-slate-900/10"
        }`}
      >
        {/* Icon */}
        <div className="shrink-0 mt-0.5 sm:mt-0">
          {isSuccess ? (
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
          ) : isError ? (
            <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-900/70 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            </div>
          ) : isWarning ? (
            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/70 flex items-center justify-center text-amber-600 dark:text-amber-400 animate-pulse">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 stroke-[2.5]" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Info className="w-4 h-4 stroke-[2.5]" />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-1">
          {title && (
            <div className="text-xs font-bold tracking-tight mb-0.5 opacity-90 flex items-center gap-1.5">
              <span>{title}</span>
            </div>
          )}
          <p className="text-xs sm:text-sm font-medium leading-snug">
            {message}
          </p>
        </div>

        {/* Optional Action Button */}
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            onClick={handleClose}
            className="shrink-0 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/25 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Dismiss notification"
          className="shrink-0 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

