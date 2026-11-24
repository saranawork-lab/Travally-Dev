"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ArrowLeft,
  ShieldCheck,
  Phone,
  MessageSquare,
  User,
  MapPin,
  Lock,
  Ban,
  Flag,
  Trash2,
  ExternalLink,
  Sparkles,
  Loader2,
  Calendar,
} from "lucide-react";
import { formatLastSeen } from "@/lib/utils";

interface DirectContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  contact: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
    bio?: string | null;
    city?: string | null;
    interests?: string | string[] | null;
    membershipTier?: string | null;
    presence?: {
      isOnline: boolean;
      lastSeenAt: string | null;
    } | null;
  } | null;
  presence?: {
    isOnline: boolean;
    lastSeenAt: string | null;
  } | null;
  onStartVoiceCall?: () => void;
  onOpenReport?: (user: { id: string; name: string }) => void;
  onBlockUser?: (userId: string, name: string) => void;
  onClearChat?: () => void;
}

export const DirectContactDrawer: React.FC<DirectContactDrawerProps> = ({
  isOpen,
  onClose,
  conversationId,
  contact,
  presence,
  onStartVoiceCall,
  onOpenReport,
  onBlockUser,
  onClearChat,
}) => {
  const router = useRouter();
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [isEnlargedPhotoOpen, setIsEnlargedPhotoOpen] = useState(false);

  if (!isOpen || !contact) return null;

  const activePresence = presence || contact.presence;
  const isOnline = activePresence?.isOnline;
  const lastSeenText = formatLastSeen(activePresence?.lastSeenAt);

  // Parse interests if array or JSON string
  let interestTags: string[] = [];
  if (Array.isArray(contact.interests)) {
    interestTags = contact.interests;
  } else if (typeof contact.interests === "string") {
    try {
      const parsed = JSON.parse(contact.interests);
      if (Array.isArray(parsed)) interestTags = parsed;
    } catch {
      interestTags = contact.interests.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  const handleClearChatConfirm = async () => {
    if (!confirm(`Are you sure you want to clear all messages with ${contact.displayName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeletingChat(true);
      const res = await fetch(`/api/chats/${conversationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (onClearChat) {
          onClearChat();
        }
        onClose();
      } else {
        alert("Failed to clear chat. Please try again.");
      }
    } catch (err) {
      console.error("Error clearing chat:", err);
      alert("Error clearing chat.");
    } finally {
      setIsDeletingChat(false);
    }
  };

  const handleBlockConfirm = () => {
    if (onBlockUser) {
      onBlockUser(contact.id, contact.displayName);
    } else {
      if (confirm(`Are you sure you want to block ${contact.displayName}?`)) {
        fetch("/api/safety/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockedId: contact.id }),
        })
          .then((res) => {
            if (res.ok) {
              alert(`${contact.displayName} has been blocked.`);
              router.push("/chats");
            }
          })
          .catch(console.error);
      }
    }
  };

  const handleReportClick = () => {
    if (onOpenReport) {
      onOpenReport({ id: contact.id, name: contact.displayName });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in select-none">
        {/* Backdrop click to dismiss */}
        <div className="absolute inset-0" onClick={onClose} />

        <aside className="relative z-10 w-full max-w-md h-full bg-[#f8fafc] dark:bg-[#0c1310] border-l border-slate-200 dark:border-emerald-950/70 shadow-2xl flex flex-col overflow-hidden animate-slide-left">
          {/* Top Bar Header */}
          <div className="px-4 py-3.5 bg-white dark:bg-[#121c17] border-b border-slate-200/80 dark:border-emerald-950/70 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -ml-1 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18241f] transition cursor-pointer"
                title="Close"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Contact info
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18241f] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/60 dark:divide-emerald-950/50">
            {/* ── SECTION 1: PROFILE HERO & PRESENCE ── */}
            <div className="p-6 bg-white dark:bg-[#121c17] text-center flex flex-col items-center">
              {/* Large Avatar */}
              <div
                onClick={() => {
                  if (contact.avatarUrl) setIsEnlargedPhotoOpen(true);
                }}
                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-lg border-4 border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-3xl shrink-0 ${
                  contact.avatarUrl ? "cursor-pointer group hover:scale-105 transition-transform" : ""
                }`}
                title={contact.avatarUrl ? "Click to view full photo" : ""}
              >
                {contact.avatarUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={contact.avatarUrl}
                      alt={contact.displayName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white">
                      View
                    </div>
                  </>
                ) : (
                  <span>{contact.displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Contact Name & Verified Badge */}
              <div className="flex items-center justify-center gap-1.5 mt-3.5 min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                  {contact.displayName}
                </h3>
                {contact.isVerified && (
                  <span title="Verified Member">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  </span>
                )}
              </div>

              {/* Online / Last Seen Status Pill */}
              <div className="mt-1 flex items-center gap-2 text-xs">
                {isOnline ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#18241f] border border-slate-200 dark:border-emerald-950 text-slate-600 dark:text-slate-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                    {lastSeenText}
                  </span>
                )}
              </div>

              {/* City / Location */}
              {contact.city && (
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{contact.city}</span>
                </div>
              )}

              {/* Membership Tier Badge */}
              {contact.membershipTier && (
                <span className="inline-flex items-center gap-1 mt-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/60">
                  ★ {contact.membershipTier.replace(/_/g, " ")}
                </span>
              )}

              {/* ── WHATSAPP-STYLE 3 PRIMARY ACTION BUTTONS ── */}
              <div className="grid grid-cols-3 gap-2.5 w-full mt-6 pt-5 border-t border-slate-100 dark:border-emerald-950/60">
                {/* Voice Call */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onStartVoiceCall) onStartVoiceCall();
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/80 dark:border-emerald-950/70 transition active:scale-95 cursor-pointer"
                  title="Voice Call"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">Audio</span>
                </button>

                {/* View Full Profile */}
                <Link
                  href={`/profile/${contact.id}?from=/chats/${conversationId}`}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/80 dark:border-emerald-950/70 transition active:scale-95 cursor-pointer"
                  title="View Full Profile"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">Profile</span>
                </Link>

                {/* Return to Message */}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/80 dark:border-emerald-950/70 transition active:scale-95 cursor-pointer"
                  title="Message"
                >
                  <div className="w-10 h-10 rounded-full bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">Message</span>
                </button>
              </div>
            </div>

            {/* ── SECTION 2: ABOUT / BIO & INTERESTS ── */}
            <div className="p-4 sm:p-5 bg-white dark:bg-[#121c17] space-y-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                  About
                </span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {contact.bio || "Explorer on Travally. Passionate about real-life connections, adventures and shared stories."}
                </p>
              </div>

              {interestTags.length > 0 && (
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                    Interests & Passions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {interestTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#18241f] text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-emerald-950/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION 3: ENCRYPTION & PRIVACY NOTICE ── */}
            <div className="p-4 sm:p-5 bg-white dark:bg-[#121c17] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Encryption
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  Messages and calls are end-to-end encrypted. No one outside of this chat, not even Travally, can read or listen to them.
                </p>
              </div>
            </div>

            {/* ── SECTION 4: WHATSAPP-STYLE DANGER ZONE ACTIONS ── */}
            <div className="p-4 sm:p-5 bg-white dark:bg-[#121c17] space-y-2">
              {/* Block Contact */}
              <button
                type="button"
                onClick={handleBlockConfirm}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Ban className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-bold block">
                    Block {contact.displayName}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                    Blocked contacts cannot call or message you
                  </span>
                </div>
              </button>

              {/* Report Contact */}
              <button
                type="button"
                onClick={handleReportClick}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 transition cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Flag className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-bold block">
                    Report {contact.displayName}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                    Submit report to Travally safety team
                  </span>
                </div>
              </button>

              {/* Clear / Delete Chat */}
              <button
                type="button"
                disabled={isDeletingChat}
                onClick={handleClearChatConfirm}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition cursor-pointer disabled:opacity-50 group"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {isDeletingChat ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-bold block">
                    Clear chat
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                    Delete messages from this chat
                  </span>
                </div>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Lightbox / Zoom view for contact profile photo */}
      {isEnlargedPhotoOpen && contact.avatarUrl && (
        <div
          onClick={() => setIsEnlargedPhotoOpen(false)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none cursor-pointer"
        >
          <button
            type="button"
            onClick={() => setIsEnlargedPhotoOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={contact.avatarUrl}
            alt={contact.displayName}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </>
  );
};
