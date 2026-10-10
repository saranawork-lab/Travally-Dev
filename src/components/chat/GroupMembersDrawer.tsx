"use client";

import React, { useState } from "react";
import {
  X,
  Users,
  Compass,
  Crown,
  ShieldCheck,
  UserX,
  Flag,
  UserMinus,
  MapPin,
  Calendar,
  Lock,
  Clock,
  MoreVertical,
  AlertTriangle
} from "lucide-react";


interface GroupMembersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: any;
  currentUser: any;
  onMemberRemoved?: (userId: string) => void;
  onOpenReport?: (user: { id: string; name: string }) => void;
  onBlockUser?: (userId: string, name: string) => void;
}

export const GroupMembersDrawer: React.FC<GroupMembersDrawerProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUser,
  onMemberRemoved,
  onOpenReport,
  onBlockUser,
}) => {
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [confirmRemovingUser, setConfirmRemovingUser] = useState<{ id: string; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isActivity = conversation?.type === "ACTIVITY";
  const organizer = conversation?.activity?.organizer || conversation?.travelPlan?.organizer;
  const organizerId = conversation?.activity?.organizerId || conversation?.travelPlan?.organizerId;
  const rawParticipants = conversation?.activity?.participants || conversation?.travelPlan?.participants || [];

  // Host member details
  const hostMember = organizer
    ? {
        id: organizer.id,
        displayName: organizer.profile?.displayName || organizer.email?.split("@")[0] || "Host Organizer",
        avatarUrl: organizer.profile?.avatarUrl,
        isVerified: organizer.profile?.isVerified,
        bio: organizer.profile?.bio,
        isHost: true,
      }
    : null;

  // Other participants (excluding host to prevent duplicates)
  const otherMembers = rawParticipants
    .filter((p: any) => p.userId !== organizerId)
    .map((p: any) => {
      const u = p.user;
      return {
        id: p.userId,
        displayName: u?.profile?.displayName || u?.email?.split("@")[0] || "Participant",
        avatarUrl: u?.profile?.avatarUrl,
        isVerified: u?.profile?.isVerified,
        bio: u?.profile?.bio,
        joinedAt: p.joinedAt,
        isHost: false,
      };
    });

  const allMembers = hostMember ? [hostMember, ...otherMembers] : otherMembers;
  const isCurrentUserHost = currentUser?.id === organizerId || currentUser?.role === "ADMIN";

  const handleExecuteRemove = async () => {
    if (!confirmRemovingUser || isRemoving) return;

    setIsRemoving(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/chats/${conversation.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: confirmRemovingUser.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove participant");
      }

      if (onMemberRemoved) {
        onMemberRemoved(confirmRemovingUser.id);
      }
      setConfirmRemovingUser(null);
      setActiveMenuUserId(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong removing the participant");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Slide-over Panel from Right */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0c120f] border-l border-slate-200 dark:border-emerald-950/70 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200/80 dark:border-emerald-950/60 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111815]/50 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  isActivity
                    ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400"
                    : "bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400"
                }`}
              >
                {isActivity ? <Users className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Group Details & Members
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#18241f] transition"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Outing / Expedition Overview Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131c18] border border-slate-200/80 dark:border-emerald-950/70 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${
                      isActivity
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                        : "bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20"
                    }`}
                  >
                    {isActivity ? "Companion Outing" : "Travel Expedition"}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                    {conversation?.title}
                  </h3>
                </div>
              </div>

              {/* Event Metas */}
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-emerald-950/50">
                {conversation?.activity && (
                  <>
                    {conversation.activity.date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(conversation.activity.date).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {conversation.activity.startTime ? ` • ${conversation.activity.startTime}` : ""}
                        </span>
                      </div>
                    )}
                    {conversation.activity.locationName && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{conversation.activity.locationName}</span>
                      </div>
                    )}
                  </>
                )}

                {conversation?.travelPlan && (
                  <>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {new Date(conversation.travelPlan.startDate).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        –{" "}
                        {new Date(conversation.travelPlan.endDate).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {conversation.travelPlan.destination && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {conversation.travelPlan.departureCity} → {conversation.travelPlan.destination}
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                  <Lock className="w-3 h-3" />
                  <span>256-bit End-to-End Encrypted Group</span>
                </div>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Members Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Members in Group ({allMembers.length})
                </h4>
                {isCurrentUserHost && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    You are Host
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {allMembers.map((member: any) => {
                  const isMe = member.id === currentUser?.id;
                  const isHost = member.isHost;
                  const menuOpen = activeMenuUserId === member.id;

                  return (
                    <div
                      key={member.id}
                      className="relative group p-3 rounded-2xl bg-white dark:bg-[#111815] border border-slate-200/80 dark:border-emerald-950/60 hover:border-emerald-500/30 transition flex items-center justify-between gap-3 shadow-xs"
                    >
                      {/* Avatar & User Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.displayName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-emerald-950/70"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-xs ${
                                isHost
                                  ? "bg-gradient-to-br from-amber-500 to-amber-600"
                                  : "bg-gradient-to-br from-emerald-500 to-emerald-700"
                              }`}
                            >
                              {member.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {isHost && (
                            <div
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-[#111815]"
                              title="Group Host"
                            >
                              <Crown className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {member.displayName}
                            </span>
                            {isMe && (
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                (You)
                              </span>
                            )}
                            {member.isVerified && (
                              <span title="Verified Explorer" className="inline-flex items-center">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5">
                            {isHost ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.2 rounded-full border border-amber-300 dark:border-amber-800/40">
                                <span>Host Organizer</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                Participant
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Member Actions (Only for other users) */}
                      {!isMe && (
                        <div className="relative shrink-0 flex items-center gap-1">
                          {/* Host Quick Remove Button */}
                          {isCurrentUserHost && !isHost && (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmRemovingUser({ id: member.id, name: member.displayName });
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-xs font-medium flex items-center gap-1"
                              title={`Remove ${member.displayName} from group`}
                            >
                              <UserMinus className="w-4 h-4" />
                              <span className="hidden sm:inline text-[11px] font-semibold">Remove</span>
                            </button>
                          )}

                          {/* 3-dots Menu for Block / Report */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuUserId(menuOpen ? null : member.id)
                              }
                              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2620] transition"
                              title="Member Options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {menuOpen && (
                              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#16201b] rounded-2xl shadow-xl border border-slate-200 dark:border-emerald-950/80 py-1.5 z-30 text-xs animate-scale-in">
                                {isCurrentUserHost && !isHost && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuUserId(null);
                                      setConfirmRemovingUser({
                                        id: member.id,
                                        name: member.displayName,
                                      });
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-semibold"
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                    <span>Remove Member</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuUserId(null);
                                    if (onBlockUser) {
                                      onBlockUser(member.id, member.displayName);
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1d2b24] flex items-center gap-2"
                                >
                                  <UserX className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Block User</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuUserId(null);
                                    if (onOpenReport) {
                                      onOpenReport({ id: member.id, name: member.displayName });
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1d2b24] flex items-center gap-2"
                                >
                                  <Flag className="w-3.5 h-3.5 text-orange-500" />
                                  <span>Report User</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Security Notice & 7-Day Validity */}
          <div className="p-4 border-t border-slate-200/80 dark:border-emerald-950/60 bg-slate-50/50 dark:bg-[#111815]/50 text-center shrink-0 space-y-1.5">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Only accepted participants can view or send messages.</span>
            </p>
            <p className="text-[10px] text-amber-700 dark:text-amber-400/90 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>7-Day Validity: Chat auto-deletes 7 days after event completion.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Host Removal */}
      {confirmRemovingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            onClick={() => setConfirmRemovingUser(null)}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <UserMinus className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Remove {confirmRemovingUser.name}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                As host, removing them will revoke their access to this chat room and reopen their spot for other verified members.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmRemovingUser(null)}
                disabled={isRemoving}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#18241f] hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRemove}
                disabled={isRemoving}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/25 transition disabled:opacity-50"
              >
                {isRemoving ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
