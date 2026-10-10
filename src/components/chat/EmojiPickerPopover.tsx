"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Zap, Compass, Coffee, Smile, PartyPopper } from "lucide-react";
import { RealisticEmoji } from "./RealisticEmoji";

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

const CATEGORIES = [
  { id: "popular", name: "Quick", icon: Zap, emojis: ["❤️", "🔥", "😂", "👏", "🎉", "👍", "😮", "😢", "✨", "🚀", "💯", "🙏"] },
  { id: "smileys", name: "Smileys", icon: Smile, emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😎", "🥳", "🥺", "🤗"] },
  { id: "travel", name: "Travel", icon: Compass, emojis: ["🏔️", "🏕️", "🚂", "🏖️", "🛺", "🥾", "🎒", "📸", "✈️", "🗺️", "🌅", "🌲", "🛶", "🛵", "🧗", "🚗", "🌊", "🏯", "🕌", "🧳"] },
  { id: "food", name: "Chai & Food", icon: Coffee, emojis: ["☕", "🍵", "🥘", "🍛", "🍿", "🎬", "🍻", "🧋", "🍕", "🥪", "🍲", "🧁", "🍩", "🥭", "🥥", "🥤", "🥂", "🍫"] },
  { id: "vibes", name: "Vibes & FX", icon: PartyPopper, emojis: ["🎉", "🎊", "🔥", "✨", "🌟", "💫", "🚀", "🎸", "🎵", "💃", "🕺", "🤝", "💪", "🌈", "⚡", "🎯", "🏆", "❤️"] },
];

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const [activeTab, setActiveTab] = useState("popular");
  const [search, setSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (popoverRef.current && popoverRef.current.contains(target as Node)) {
        return;
      }
      if (target && target.closest("[data-emoji-toggle]")) {
        return;
      }
      onCloseRef.current();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCategory = CATEGORIES.find((c) => c.id === activeTab) || CATEGORIES[0];

  const filteredEmojis = search.trim()
    ? CATEGORIES.flatMap((c) => c.emojis).filter((_, idx, arr) => arr.indexOf(_) === idx)
    : currentCategory.emojis;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-16 right-2 sm:right-6 w-72 sm:w-80 bg-white/95 dark:bg-[#111815]/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-emerald-950/80 shadow-2xl p-3 z-50 animate-slide-up text-xs select-none"
    >
      {/* Search Header */}
      <div className="relative mb-2.5">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emojis or vibes..."
          className="w-full pl-8 pr-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
        />
      </div>

      {/* Category Tabs */}
      {!search.trim() && (
        <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-100 dark:border-emerald-950/60 mb-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16201b]"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-7 gap-1 max-h-48 overflow-y-auto pr-1">
        {filteredEmojis.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-orange-100/60 dark:hover:bg-orange-950/40 hover:scale-130 transition-transform duration-200 active:scale-90"
          >
            <RealisticEmoji emoji={emoji} size={26} animate={true} />
          </button>
        ))}
      </div>

      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-emerald-950/60 flex items-center justify-between text-[10px] text-slate-400">
        <span>Click to insert • Double-click message to react ❤️</span>
        <button
          onClick={onClose}
          className="text-orange-500 font-bold hover:underline"
        >
          Close
        </button>
      </div>
    </div>
  );
};
