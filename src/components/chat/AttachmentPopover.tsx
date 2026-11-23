"use client";

import React, { useEffect, useRef } from "react";
import { Image as ImageIcon, MapPin, Compass } from "lucide-react";

interface AttachmentPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAttachment: (type: "PHOTO" | "LOCATION" | "TRIP") => void;
  showItineraryPin?: boolean;
  itineraryType?: "TRAVEL" | "ACTIVITY";
}

export const AttachmentPopover: React.FC<AttachmentPopoverProps> = ({
  isOpen,
  onClose,
  onSelectAttachment,
  showItineraryPin = false,
  itineraryType = "TRAVEL",
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click outside to dismiss popover
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      // If clicking inside the popover or on the toggle button, let it handle naturally
      if (popoverRef.current && popoverRef.current.contains(target as Node)) {
        return;
      }
      if (target && target.closest("[data-attachment-toggle]")) {
        return;
      }
      onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ATTACHMENT_OPTIONS = [
    {
      id: "PHOTO" as const,
      label: "Photo",
      icon: ImageIcon,
      color:
        "bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 text-emerald-700 dark:from-emerald-950/90 dark:to-teal-900/60 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/60",
    },
    {
      id: "LOCATION" as const,
      label: "Location",
      icon: MapPin,
      color:
        "bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 text-orange-700 dark:from-orange-950/90 dark:to-amber-900/60 dark:text-orange-300 border-orange-300/80 dark:border-orange-700/60",
    },
    ...(showItineraryPin
      ? [
          {
            id: "TRIP" as const,
            label: itineraryType === "ACTIVITY" ? "Activity Pin" : "Trip Pin",
            icon: Compass,
            color:
              "bg-gradient-to-br from-teal-100 via-cyan-50 to-teal-100 text-teal-700 dark:from-teal-950/90 dark:to-cyan-900/60 dark:text-teal-300 border-teal-300/80 dark:border-teal-700/60",
          },
        ]
      : []),
  ];

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full mb-3 left-0 z-50 animate-slide-up select-none"
    >
      {/* ── STRAIGHT HORIZONTAL ROW DOCK EXACTLY ABOVE THE PLUS BUTTON ── */}
      <div className="bg-white/95 dark:bg-[#111815]/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-emerald-950/80 shadow-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3">
        {ATTACHMENT_OPTIONS.map((opt, idx) => {
          const Icon = opt.icon;
          const animDelay = `${idx * 60}ms`;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onSelectAttachment(opt.id);
                onClose();
              }}
              style={{ animationDelay: animDelay }}
              className="flex flex-col items-center gap-1.5 p-1 sm:p-1.5 rounded-2xl hover:bg-slate-100/70 dark:hover:bg-[#18241f]/70 transition-all group focus:outline-none cursor-pointer"
            >
              {/* Logo / Badge Icon */}
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${opt.color} group-hover:scale-105 group-active:scale-95 transition-transform duration-200`}
              >
                <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              </div>

              {/* Slightly visible label text below the logo */}
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white tracking-tight text-center leading-none transition-colors">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
