"use client";

import React from "react";

interface TypingUser {
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  isGroupChat: boolean;
}

/**
 * Instagram-style typing indicator with animated three dots.
 * - 1-on-1 chat: Shows a sleek chat bubble with animated bouncing dots.
 * - Group chat: Shows each typing user one by one below with their avatar, name, and three dots.
 */
export function TypingIndicator({ typingUsers, isGroupChat }: TypingIndicatorProps) {
  if (!typingUsers || typingUsers.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 pt-1 pb-1 animate-fade-in select-none">
      {isGroupChat ? (
        // ── GROUP CHAT: Show each typer individually, one by one below ──
        typingUsers.map((user) => (
          <div key={user.userId} className="flex items-end gap-2 animate-slide-up">
            {/* Typer Avatar */}
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-[10px] font-bold text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30 shrink-0 shadow-sm overflow-hidden mb-0.5">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.displayName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Name + Typing Bubble */}
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">
                {user.displayName}
              </span>
              <div className="flex items-center px-3.5 py-2 rounded-2xl rounded-bl-[4px] bg-white dark:bg-[#16201b] border border-slate-200/90 dark:border-emerald-950/80 shadow-xs">
                <ThreeDotsAnimation />
              </div>
            </div>
          </div>
        ))
      ) : (
        // ── 1-ON-1 CHAT: Instagram-style minimal bubble with 3 bouncing dots ──
        <div className="flex items-end gap-2 animate-slide-up">
          {/* Partner Avatar */}
          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-[10px] font-bold text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30 shrink-0 shadow-sm overflow-hidden mb-0.5">
            {typingUsers[0].avatarUrl ? (
              <img
                src={typingUsers[0].avatarUrl}
                alt={typingUsers[0].displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              typingUsers[0].displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Instagram-style 3 dots bubble */}
          <div className="flex items-center px-4 py-2.5 rounded-2xl rounded-bl-[4px] bg-white dark:bg-[#16201b] border border-slate-200/90 dark:border-emerald-950/80 shadow-xs">
            <ThreeDotsAnimation />
          </div>
        </div>
      )}
    </div>
  );
}

/** Animated three bouncing dots — Instagram DM style */
function ThreeDotsAnimation() {
  return (
    <div className="flex items-center gap-[4px] h-3.5 px-0.5">
      <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-400 animate-typing-dot-1" />
      <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-400 animate-typing-dot-2" />
      <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-400 animate-typing-dot-3" />
    </div>
  );
}
