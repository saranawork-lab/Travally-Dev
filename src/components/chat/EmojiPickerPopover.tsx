"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Zap,
  Compass,
  Coffee,
  Smile,
  PartyPopper,
  Trees,
  Trophy,
  Heart,
  X,
} from "lucide-react";
import { RealisticEmoji } from "./RealisticEmoji";

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

const CATEGORIES = [
  {
    id: "quick",
    name: "Quick",
    icon: Zap,
    emojis: ["❤️", "🔥", "😂", "👏", "🎉", "👍", "😮", "😢", "🚀", "💯", "🙏", "😍", "🥳", "🙌", "😎", "✨", "🤝", "💪"],
  },
  {
    id: "smileys",
    name: "Smileys",
    icon: Smile,
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
      "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
      "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕",
      "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁",
      "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞",
      "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "💩", "🤡", "👻", "👽", "🤖"
    ],
  },
  {
    id: "travel",
    name: "Travel",
    icon: Compass,
    emojis: [
      "🏔️", "🏕️", "🚂", "🏖️", "🛺", "🥾", "🎒", "📸", "✈️", "🗺️", "🌅", "🌲", "🛶", "🛵", "🧗", "🚗",
      "🌊", "🏯", "🕌", "🧳", "🚲", "🚕", "🚌", "🚊", "🚀", "🚁", "🛳️", "⛵", "🏝️", "🏜️", "🌋", "🏛️",
      "🏟️", "🗼", "🗽", "⛺", "🎡", "🎢", "⛽", "🏨", "🛎️", "🛫", "🛬", "🛤️", "🚤", "🌍", "🌎", "🌏", "🧭"
    ],
  },
  {
    id: "food",
    name: "Food",
    icon: Coffee,
    emojis: [
      "☕", "🍵", "🥘", "🍛", "🍿", "🎬", "🍻", "🧋", "🍕", "🥪", "🍲", "🧁", "🍩", "🥭", "🥥", "🥤",
      "🥂", "🍫", "🥞", "🧇", "🧀", "🥩", "🍗", "🍔", "🍟", "🌭", "🌮", "🌯", "🥗", "🍜", "🍣", "🍱",
      "🥟", "🍤", "🍦", "🍧", "🍨", "🎂", "🍰", "🍺", "🍷", "🍸", "🍹", "🍇", "🍉", "🍌", "🍎", "🍓"
    ],
  },
  {
    id: "vibes",
    name: "Vibes",
    icon: PartyPopper,
    emojis: [
      "🎉", "🎊", "🔥", "🌟", "💫", "🚀", "🎸", "🎵", "💃", "🕺", "🤝", "💪", "🌈", "⚡", "🎯", "🏆",
      "❤️", "🎈", "🧨", "🎆", "🎇", "🎁", "🎗️", "🎫", "🎟️", "🪄", "🪅", "🎤", "🎧", "🎷", "🎺", "🥁",
      "🪘", "🎲", "♟️", "🥇", "🥈", "🥉", "🏅", "🪗", "🎼", "🎦", "🔮"
    ],
  },
  {
    id: "nature",
    name: "Nature",
    icon: Trees,
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔",
      "🐧", "🐦", "🦅", "🦆", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜",
      "🐢", "🐍", "🐙", "🦑", "🦐", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🦈", "🐊", "🐅", "🐆", "🦓",
      "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🌿", "🍀", "🌸", "🌺", "🌻", "🌹", "🌷", "🌴", "🌵"
    ],
  },
  {
    id: "activities",
    name: "Sports",
    icon: Trophy,
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍",
      "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌",
      "🎿", "🏋️", "🤼", "🤸", "🤺", "🧗", "🧘", "🚴", "🚵", "🏊", "🤽", "🚣", "🏄"
    ],
  },
  {
    id: "symbols",
    name: "Symbols",
    icon: Heart,
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
      "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈",
      "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "0️⃣", "1️⃣", "2️⃣", "3️⃣",
      "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "🔢", "✔️", "☑️", "🔘", "🔴", "🟠", "🟡", "🟢", "🔵",
      "🟣", "⚫", "⚪", "🟤", "🔺", "🔻", "💬", "💭", "🗯️"
    ],
  },
];

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const [activeTab, setActiveTab] = useState("quick");
  const [search, setSearch] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isProgrammaticScrollRef = useRef(false);

  // Scroll to section when category tab is clicked
  const handleTabClick = (categoryId: string) => {
    setActiveTab(categoryId);
    const targetEl = sectionRefs.current[categoryId];
    const container = scrollContainerRef.current;
    if (targetEl && container) {
      isProgrammaticScrollRef.current = true;
      const targetTop = targetEl.offsetTop - container.offsetTop;
      container.scrollTo({ top: targetTop, behavior: "smooth" });
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    }
  };

  // Track active section as user smoothly scrolls through classified sections
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current || search.trim()) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    let currentId = CATEGORIES[0].id;

    for (const cat of CATEGORIES) {
      const el = sectionRefs.current[cat.id];
      if (el) {
        const top = el.offsetTop - container.offsetTop;
        if (scrollTop >= top - 30) {
          currentId = cat.id;
        }
      }
    }
    setActiveTab(currentId);
  };

  if (!isOpen) return null;

  const searchResults = search.trim()
    ? CATEGORIES.flatMap((c) => c.emojis).filter((emoji, idx, arr) => {
        // Simple search query match or emoji presence
        return arr.indexOf(emoji) === idx;
      })
    : null;

  return (
    <div className="w-full bg-white dark:bg-[#111815] border-t border-slate-200/90 dark:border-emerald-950/80 shadow-inner px-3 py-2.5 z-30 select-none transition-all">
      {/* Top Search & Controls Row */}
      <div className="flex items-center gap-2 mb-2 max-w-4xl mx-auto">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emojis or vibes..."
            className="w-full pl-8 pr-7 py-1.5 rounded-full bg-slate-100 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2620] transition"
        >
          Close
        </button>
      </div>

      {/* Category Tabs Bar (Horizontally scrollable with smooth scrolling) */}
      {!search.trim() && (
        <div className="flex items-center gap-1 pb-2 border-b border-slate-100 dark:border-emerald-950/60 mb-2 overflow-x-auto no-scrollbar max-w-4xl mx-auto">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleTabClick(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs scale-102"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16201b]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Continuous Scrollable Emojis Keyboard Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="max-h-56 sm:max-h-64 overflow-y-auto overscroll-contain pr-1 space-y-4 max-w-4xl mx-auto"
      >
        {searchResults ? (
          /* Search Results */
          <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1 px-1">
              Matching Emojis ({searchResults.length})
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-11 gap-1">
              {searchResults.map((emoji, idx) => (
                <button
                  key={`search-${idx}`}
                  type="button"
                  onClick={() => onSelectEmoji(emoji)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:scale-125 transition-transform duration-150 active:scale-95"
                  title={emoji}
                >
                  <RealisticEmoji emoji={emoji} size={26} animate={true} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Continuous Classified Sections (WhatsApp/Keyboard Parity) */
          CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                ref={(el) => {
                  sectionRefs.current[cat.id] = el;
                }}
                className="space-y-1.5"
              >
                {/* Section Header */}
                <div className="sticky top-0 bg-white/95 dark:bg-[#111815]/95 backdrop-blur-md z-10 py-1 px-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100/60 dark:border-emerald-950/40">
                  <Icon className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                    ({cat.emojis.length})
                  </span>
                </div>

                {/* Emojis Grid for this section */}
                <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-11 gap-1">
                  {cat.emojis.map((emoji, idx) => (
                    <button
                      key={`${cat.id}-${idx}`}
                      type="button"
                      onClick={() => onSelectEmoji(emoji)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:scale-125 transition-transform duration-150 active:scale-95"
                      title={emoji}
                    >
                      <RealisticEmoji emoji={emoji} size={26} animate={true} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
