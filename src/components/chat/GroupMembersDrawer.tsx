"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  X,
  Users,
  Compass,
  Crown,
  ShieldCheck,
  UserX,
  Flag,
  UserMinus,
  UserPlus,
  MapPin,
  Calendar,
  Lock,
  Clock,
  MoreVertical,
  AlertTriangle,
  Camera,
  Search,
  Check,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface GroupMembersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: any;
  currentUser: any;
  onMemberRemoved?: (userId: string) => void;
  onMemberAdded?: (participant: any) => void;
  onGroupProfileUpdated?: (imageUrl: string) => void;
  onOpenReport?: (user: { id: string; name: string }) => void;
  onBlockUser?: (userId: string, name: string) => void;
}

export const GroupMembersDrawer: React.FC<GroupMembersDrawerProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUser,
  onMemberRemoved,
  onMemberAdded,
  onGroupProfileUpdated,
  onOpenReport,
  onBlockUser,
}) => {
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [confirmRemovingUser, setConfirmRemovingUser] = useState<{ id: string; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Group Photo Edit state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [groupPhoto, setGroupPhoto] = useState<string | null>(
    conversation?.activity?.imageUrl || conversation?.travelPlan?.imageUrl || null
  );

  // Add Participant state
  const [showAddView, setShowAddView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  // Sync photo with conversation changes
  useEffect(() => {
    const photo = conversation?.activity?.imageUrl || conversation?.travelPlan?.imageUrl || null;
    setGroupPhoto(photo);
  }, [conversation]);

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

  // Handle Photo Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setIsUploadingPhoto(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      try {
        const res = await fetch(`/api/chats/${conversation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: dataUrl }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update profile picture");
        }

        setGroupPhoto(dataUrl);
        if (conversation.activity) conversation.activity.imageUrl = dataUrl;
        if (conversation.travelPlan) conversation.travelPlan.imageUrl = dataUrl;
        if (onGroupProfileUpdated) onGroupProfileUpdated(dataUrl);

        setSuccessMsg("Group profile picture updated successfully!");
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to update group picture");
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Fetch Candidates for Adding
  const fetchCandidates = async (query = "") => {
    setIsLoadingCandidates(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/chats/${conversation.id}/participants?search=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  // Handle Add Participant
  const handleAddParticipant = async (targetUser: any) => {
    setAddingUserId(targetUser.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/chats/${conversation.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetUser.id, action: "add" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add participant");
      }

      setCandidates((prev) => prev.filter((c) => c.id !== targetUser.id));
      if (onMemberAdded) {
        onMemberAdded(data.participant || targetUser);
      }

      setSuccessMsg(`${targetUser.profile?.displayName || targetUser.email?.split("@")[0]} added to group!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong adding participant");
    } finally {
      setAddingUserId(null);
    }
  };

  const handleExecuteRemove = async () => {
    if (!confirmRemovingUser || isRemoving) return;

    setIsRemoving(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/chats/${conversation.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: confirmRemovingUser.id, action: "remove" }),
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
              {showAddView ? (
                <button
                  type="button"
                  onClick={() => setShowAddView(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#1a2620] transition"
                  title="Back to group details"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    isActivity
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400"
                      : "bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400"
                  }`}
                >
                  {isActivity ? <Users className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
                </div>
              )}
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {showAddView ? "Add Participants" : "Group Details & Members"}
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

          {/* Success / Error Alerts */}
          {errorMsg && (
            <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {showAddView ? (
              /* ─── ADD PARTICIPANTS SUB-VIEW ─── */
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search explorers by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      fetchCandidates(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#15201b] border border-slate-200/90 dark:border-emerald-950/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Suggested Explorers
                  </h4>

                  {isLoadingCandidates ? (
                    <div className="py-8 text-center text-xs text-slate-400 animate-pulse flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      <span>Finding explorers...</span>
                    </div>
                  ) : candidates.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No matching explorers found.
                    </div>
                  ) : (
                    candidates.map((candidate) => {
                      const name = candidate.profile?.displayName || candidate.email?.split("@")[0];
                      const avatar = candidate.profile?.avatarUrl;
                      const isAdding = addingUserId === candidate.id;

                      return (
                        <div
                          key={candidate.id}
                          className="p-3 rounded-2xl bg-white dark:bg-[#111815] border border-slate-200/80 dark:border-emerald-950/60 flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-emerald-950/70"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                {name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {name}
                                </span>
                                {candidate.profile?.isVerified && (
                                  <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {candidate.profile?.city || candidate.email}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddParticipant(candidate)}
                            disabled={isAdding}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            {isAdding ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* ─── GROUP DETAILS & MEMBERS MAIN VIEW ─── */
              <>
                {/* Outing / Expedition Overview Card with Profile Picture */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131c18] border border-slate-200/80 dark:border-emerald-950/70 space-y-3.5">
                  <div className="flex items-start gap-3.5">
                    {/* Group Profile Picture with Change Overlay */}
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-emerald-900/60 shadow-md bg-slate-100 dark:bg-[#16221c] flex items-center justify-center">
                        {groupPhoto ? (
                          <img
                            src={groupPhoto}
                            alt={conversation?.title || "Group Photo"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center text-white ${
                              isActivity ? "bg-emerald-500" : "bg-orange-500"
                            }`}
                          >
                            {isActivity ? <Users className="w-7 h-7" /> : <Compass className="w-7 h-7" />}
                          </div>
                        )}
                      </div>

                      {/* Change Profile Pic Button */}
                      {isCurrentUserHost && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          title="Change Group Profile Picture"
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-[#131c18] transition cursor-pointer"
                        >
                          {isUploadingPhoto ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Camera className="w-3 h-3" />
                          )}
                        </button>
                      )}

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                          isActivity
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                            : "bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20"
                        }`}
                      >
                        {isActivity ? "Companion Outing" : "Travel Expedition"}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug truncate">
                        {conversation?.title}
                      </h3>
                      {isCurrentUserHost && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>{groupPhoto ? "Change Group Photo" : "Add Group Photo"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Event Metas */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-emerald-950/50">
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
                  </div>
                </div>

                {/* Members Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Members in Group ({allMembers.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      {isCurrentUserHost && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddView(true);
                            fetchCandidates("");
                          }}
                          className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      )}
                      {isCurrentUserHost && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Host
                        </span>
                      )}
                    </div>
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
                          {/* Avatar & User Info (Links directly to profile page) */}
                          <Link
                            href={
                              isMe
                                ? `/profile?from=/chats/${conversation?.id}`
                                : `/profile/${member.id}?from=/chats/${conversation?.id}`
                            }
                            className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-85 transition cursor-pointer"
                            title={isMe ? "View your profile" : `View ${member.displayName}'s profile`}
                          >
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
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate hover:underline">
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
                          </Link>

                          {/* Action Menu (Only for non-hosts) */}
                          {!isHost && (
                            <div className="relative shrink-0 flex items-center gap-1">
                              {/* Fast Host Quick-Remove Button */}
                              {isCurrentUserHost && !isMe && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmRemovingUser({ id: member.id, name: member.displayName });
                                  }}
                                  className="p-1.5 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                  title={`Remove ${member.displayName} from group`}
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              )}

                              {/* Three-dots menu */}
                              {!isMe && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuUserId(menuOpen ? null : member.id);
                                  }}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16221c] transition"
                                  title="More actions"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              )}

                              {/* Dropdown Options */}
                              {menuOpen && !isMe && (
                                <div className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-white dark:bg-[#15201b] border border-slate-200 dark:border-emerald-950/80 shadow-xl py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150">
                                  {isCurrentUserHost && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setConfirmRemovingUser({ id: member.id, name: member.displayName });
                                        setActiveMenuUserId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-2 transition"
                                    >
                                      <UserMinus className="w-3.5 h-3.5 shrink-0" />
                                      <span>Remove</span>
                                    </button>
                                  )}

                                  {onBlockUser && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onBlockUser(member.id, member.displayName);
                                        setActiveMenuUserId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1d2a23] font-medium flex items-center gap-2 transition"
                                    >
                                      <UserX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span>Block User</span>
                                    </button>
                                  )}

                                  {onOpenReport && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onOpenReport({ id: member.id, name: member.displayName });
                                        setActiveMenuUserId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-medium flex items-center gap-2 transition"
                                    >
                                      <Flag className="w-3.5 h-3.5 shrink-0" />
                                      <span>Report</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Removing Member */}
      {confirmRemovingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setConfirmRemovingUser(null)}
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <UserMinus className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Remove {confirmRemovingUser.name}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                They will lose access to this group chat immediately and their spot will reopen for other explorers.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmRemovingUser(null)}
                disabled={isRemoving}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-[#18241f] dark:hover:bg-[#203029] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRemove}
                disabled={isRemoving}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
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
