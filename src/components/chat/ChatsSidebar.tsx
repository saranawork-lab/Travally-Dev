"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Compass,
  Search,
  PanelLeftClose,
  MessageSquare,
  X
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

interface ChatsSidebarProps {
  activeConversationId: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
}

const parseLastMessageSnippet = (content?: string): string => {
  if (!content) return "No messages yet";
  try {
    const parsed = JSON.parse(content);
    if (parsed.e2ee || parsed.ciphertext || parsed.iv) return "🔒 Encrypted message";
    if (parsed.mediaType === "PHOTO") return "📷 Photo";
    if (parsed.mediaType === "LOCATION") return "📍 Meetup point";
    if (parsed.mediaType === "TRIP") return "🎒 Trip itinerary";
    if (parsed.text) return parsed.text;
  } catch {
    // plain text
  }
  if (content.startsWith("{") && content.includes('"e2ee"')) {
    return "🔒 Encrypted message";
  }
  return content;
};

export const ChatsSidebar: React.FC<ChatsSidebarProps> = ({
  activeConversationId,
  isCollapsed,
  onToggleCollapse,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
}) => {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "ACTIVITY" | "TRAVEL">("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chats");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error("ChatsSidebar fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchChats();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = conversations.filter((c) => {
    if (filterType !== "ALL" && c.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = (c.title || "").toLowerCase();
      const targetTitle = (c.activity?.title || c.travelPlan?.destination || "").toLowerCase();
      return title.includes(q) || targetTitle.includes(q);
    }
    return true;
  });

  // Sidebar content component (used for both desktop sidebar and mobile overlay drawer)
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0e1511] border-r border-slate-200/80 dark:border-emerald-950/70 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/70 dark:border-emerald-950/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Link
            href="/chats"
            className="text-base font-extrabold text-slate-900 dark:text-white hover:text-emerald-600 transition tracking-tight"
          >
            Chats
          </Link>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            {conversations.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Collapse sidebar button (desktop/tablet) */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#18241f] transition"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>

          {/* Close mobile drawer button */}
          {onCloseMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#18241f] transition"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 pb-2 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#141d18] border border-slate-200 dark:border-emerald-950/70 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 pb-2 flex items-center gap-1.5 shrink-0 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setFilterType("ALL")}
          className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
            filterType === "ALL"
              ? "bg-gradient-to-r from-emerald-100 via-teal-50 to-orange-100 dark:from-emerald-950/60 dark:to-orange-950/60 text-slate-800 dark:text-slate-100 border border-emerald-300/80 dark:border-emerald-700/60 shadow-xs"
              : "bg-slate-100/80 dark:bg-[#16201b] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilterType("ACTIVITY")}
          className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 ${
            filterType === "ACTIVITY"
              ? "bg-gradient-to-r from-emerald-100 to-teal-50 dark:from-emerald-950/70 dark:to-teal-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 shadow-xs"
              : "bg-slate-100/80 dark:bg-[#16201b] text-slate-600 dark:text-slate-400 hover:text-emerald-700"
          }`}
        >
          <Users className="w-3 h-3" />
          <span>Companion</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType("TRAVEL")}
          className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 ${
            filterType === "TRAVEL"
              ? "bg-gradient-to-r from-orange-100 to-amber-50 dark:from-orange-950/70 dark:to-amber-900/60 text-orange-800 dark:text-orange-300 border border-orange-300/80 dark:border-orange-700/60 shadow-xs"
              : "bg-slate-100/80 dark:bg-[#16201b] text-slate-600 dark:text-slate-400 hover:text-orange-700"
          }`}
        >
          <Compass className="w-3 h-3" />
          <span>Trips</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {loading ? (
          <div className="space-y-1.5 p-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse flex items-center gap-2.5 p-2 rounded-xl bg-slate-100 dark:bg-[#131c18]"
              >
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 px-4">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No chats found</p>
            <p className="text-[11px] mt-0.5">Explore activities or trips to join new groups.</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isActivity = conv.type === "ACTIVITY";
            const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;
            const senderDisplayName =
              lastMsg?.sender?.profile?.displayName || lastMsg?.sender?.email?.split("@")[0];
            const snippet = parseLastMessageSnippet(lastMsg?.content);
            const timeAgo = lastMsg ? formatTimeAgo(lastMsg.createdAt) : formatTimeAgo(conv.updatedAt);

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => {
                  if (conv.id !== activeConversationId) {
                    router.push(`/chats/${conv.id}`);
                  }
                  if (onCloseMobileDrawer) {
                    onCloseMobileDrawer();
                  }
                }}
                className={`w-full text-left p-2.5 rounded-2xl transition flex items-center gap-2.5 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-orange-500/10 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-500/30 shadow-xs"
                    : "hover:bg-slate-50 dark:hover:bg-[#141e19] border border-transparent"
                }`}
              >
                {/* Room Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    isActivity
                      ? "bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/80 dark:to-teal-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40"
                      : "bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/80 dark:to-amber-900/60 text-orange-700 dark:text-orange-300 border-orange-200/60 dark:border-orange-800/40"
                  }`}
                >
                  {isActivity ? <Users className="w-3.5 h-3.5" /> : <Compass className="w-3.5 h-3.5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-xs font-bold truncate ${
                        isActive
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {conv.title}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                      {timeAgo}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-medium shrink-0 ${
                        isActivity
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                          : "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300"
                      }`}
                    >
                      {isActivity ? "Companion" : "Trip"}
                    </span>
                    <span className="truncate">
                      {senderDisplayName ? `${senderDisplayName}: ` : ""}
                      {snippet}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / Laptop / Tablet Side-by-Side Sidebar */}
      <aside
        className={`hidden md:block h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
          isCollapsed ? "w-0 border-none" : "w-72 lg:w-80"
        }`}
      >
        <div className="w-72 lg:w-80 h-full">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer (When toggled open on mobile) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={onCloseMobileDrawer}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-fade-in"
          />
          <div className="relative w-4/5 max-w-sm h-full z-10 shadow-2xl animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
