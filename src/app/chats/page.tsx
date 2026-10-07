"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Users,
  Compass,
  ArrowRight,
  Search,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

const parseLastMessageSnippet = (content?: string): string => {
  if (!content) return "No messages yet";
  try {
    const parsed = JSON.parse(content);
    if (parsed.e2ee || parsed.ciphertext || parsed.iv) return "🔒 Encrypted message";
    if (parsed.mediaType === "PHOTO") return "📷 Photo";
    if (parsed.mediaType === "LOCATION") return "📍 Meetup location";
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

export default function ChatsInboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
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
      console.error(e);
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
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = (c.title || "").toLowerCase();
      const targetTitle = (c.activity?.title || c.travelPlan?.destination || "").toLowerCase();
      return title.includes(q) || targetTitle.includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d0b] text-slate-900 dark:text-slate-100 relative overflow-hidden pb-24 font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Chats
            </h1>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/70 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 shadow-sm transition"
            />
          </div>
        </div>

        {/* Conversations List - Refined Single Line Items */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#111815] border border-slate-200/80 dark:border-emerald-950/60"
              >
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0" />
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/70 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              No active conversations yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed mb-4">
              When an organizer accepts your request, your private encrypted group chat will appear right here.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-emerald-950 dark:text-emerald-200 bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/80 dark:to-teal-950/70 hover:from-emerald-200 hover:to-teal-100 border border-emerald-300/80 dark:border-emerald-800/60 shadow-xs transition-all"
            >
              <span>Explore Discover Feed</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((conv) => {
              const isActivity = conv.type === "ACTIVITY";
              const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;
              const senderDisplayName = lastMsg?.sender?.profile?.displayName || lastMsg?.sender?.email?.split("@")[0];
              const snippet = parseLastMessageSnippet(lastMsg?.content);
              const timeDisplay = lastMsg ? formatTimeAgo(lastMsg.createdAt) : formatTimeAgo(conv.updatedAt);

              return (
                <Link
                  key={conv.id}
                  href={`/chats/${conv.id}`}
                  className="group flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-2xl bg-white dark:bg-[#111815] border border-slate-200/80 dark:border-emerald-950/60 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:bg-slate-50/80 dark:hover:bg-[#15201b] transition-all shadow-sm"
                >
                  {/* Single Line: Icon + Title + Snippet */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
                        isActivity
                          ? "bg-emerald-500"
                          : "bg-orange-500"
                      }`}
                    >
                      {isActivity ? <Users className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0 flex-1 text-xs">
                      {/* Title */}
                      <span className="font-medium text-slate-800 dark:text-slate-100 truncate shrink-0 max-w-[140px] xs:max-w-[170px] sm:max-w-[220px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {conv.title}
                      </span>

                      {/* Pill Badge */}
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 text-white ${
                          isActivity
                            ? "bg-emerald-500"
                            : "bg-orange-500"
                        }`}
                      >
                        {isActivity ? "Companion" : "Trip"}
                      </span>

                      {/* Divider & Snippet */}
                      <span className="text-slate-400 dark:text-slate-500 truncate min-w-0">
                        • {senderDisplayName ? `${senderDisplayName}: ` : ""}{snippet}
                      </span>
                    </div>
                  </div>

                  {/* Time & Chevron on the right */}
                  <div className="flex items-center gap-1.5 shrink-0 text-slate-400 dark:text-slate-500 text-[11px]">
                    <span className="whitespace-nowrap">{timeDisplay}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
