"use client";

import React, { useState } from "react";

export type MessageDeliveryStatus = "sending" | "sent" | "delivered" | "read";

interface MessageStatusBeaconProps {
  status: MessageDeliveryStatus;
  size?: number;
  className?: string;
  recipientName?: string;
  timestamp?: string;
}

/**
 * Travally Waypoint Aero Wings Status Indicator:
 * A distinctive, travel-themed status indicator functionally identical to WhatsApp's 3-stage logic
 * (Sent -> Delivered -> Read), but using precision aerodynamic waypoint wings instead of checkmark ticks.
 *
 * 1. "sending":   Smooth spinning orbital dash (In-flight transmission)
 * 2. "sent":      1 single crisp forward wing [ › ] (Dispatched to server)
 * 3. "delivered": 2 dual forward wings [ » ] (Received on peer's device)
 * 4. "read":      2 dual luminous emerald wings [ » ] with neon glow (Opened & seen by recipient)
 */
export const MessageStatusBeacon: React.FC<MessageStatusBeaconProps> = ({
  status,
  size = 17,
  className = "",
  recipientName = "Recipient",
  timestamp,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusDetails = () => {
    switch (status) {
      case "sending":
        return {
          title: "Sending...",
          desc: "In-flight dispatch",
          badgeColor: "bg-slate-700 text-slate-200",
        };
      case "sent":
        return {
          title: "Sent",
          desc: "Dispatched to Travally cloud",
          badgeColor: "bg-slate-800 text-slate-200",
        };
      case "delivered":
        return {
          title: "Delivered",
          desc: `Received on ${recipientName}'s device`,
          badgeColor: "bg-slate-800 text-slate-200",
        };
      case "read":
        return {
          title: "Read",
          desc: `Seen by ${recipientName}`,
          badgeColor: "bg-emerald-950 text-emerald-300 border border-emerald-500/30",
        };
    }
  };

  const details = getStatusDetails();

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 relative cursor-pointer select-none group/status ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        e.stopPropagation();
        setShowTooltip((prev) => !prev);
      }}
      title={`${details.title}: ${details.desc}`}
      aria-label={`Message Status: ${details.title}`}
    >
      {/* ── 1. SENDING: Smooth Orbital Dispatch Spinner ── */}
      {status === "sending" && (
        <svg
          width={size}
          height={12}
          viewBox="0 0 18 12"
          fill="none"
          className="animate-spin opacity-80"
          style={{ animationDuration: "1s" }}
        >
          <circle
            cx="9"
            cy="6"
            r="4.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeDasharray="5 3.5"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* ── 2. SENT: 1 Single Precision Forward Waypoint Wing [ › ] (WhatsApp Single Tick) ── */}
      {status === "sent" && (
        <svg
          width={size}
          height={12}
          viewBox="0 0 18 12"
          fill="none"
          className="opacity-85 transition-opacity hover:opacity-100"
        >
          {/* Centered forward wing */}
          <path
            d="M 6.5 2.5 L 11 6 L 6.5 9.5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* ── 3. DELIVERED: 2 Dual Forward Waypoint Wings [ » ] (WhatsApp Double Tick) ── */}
      {status === "delivered" && (
        <svg
          width={size}
          height={12}
          viewBox="0 0 18 12"
          fill="none"
          className="opacity-95 transition-opacity hover:opacity-100"
        >
          {/* Left Wing */}
          <path
            d="M 4 2.5 L 8.5 6 L 4 9.5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right Wing */}
          <path
            d="M 9.5 2.5 L 14 6 L 9.5 9.5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* ── 4. READ: 2 Dual Luminous Emerald Wings [ » ] (WhatsApp Blue Double Tick) ── */}
      {status === "read" && (
        <svg
          width={size}
          height={12}
          viewBox="0 0 18 12"
          fill="none"
          className="text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.95)] transition-transform duration-200 hover:scale-115"
        >
          {/* Left Glowing Wing */}
          <path
            d="M 4 2.5 L 8.5 6 L 4 9.5"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right Glowing Wing */}
          <path
            d="M 9.5 2.5 L 14 6 L 9.5 9.5"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Floating Micro-Tooltip */}
      {showTooltip && (
        <span
          className={`absolute bottom-full mb-1.5 right-0 px-2.5 py-1 rounded-lg ${details.badgeColor} text-[10px] font-semibold whitespace-nowrap shadow-xl backdrop-blur-md z-50 pointer-events-none animate-fade-in flex items-center gap-1.5`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
          <span>{details.title}</span>
          {timestamp && <span className="opacity-60 text-[9px]">• {timestamp}</span>}
        </span>
      )}
    </span>
  );
};

