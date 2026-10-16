"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Camera,
  Heart,
  MapPin,
  Trash2,
  X,
  Clock,
  Compass,
  MoreVertical,
  Pencil,
  Loader2,
  UploadCloud,
  Check,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

interface InstantItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  location?: string;
  imageUrl?: string;
  caption?: string;
  likesCount: number;
  likes: string[];
  createdAt: string;
}

interface UserInstantsSectionProps {
  userId: string;
  userName?: string;
  isOwn?: boolean;
}

export function UserInstantsSection({ userId, userName, isOwn }: UserInstantsSectionProps) {
  const [instants, setInstants] = useState<InstantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<InstantItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Three dots menu states
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openModalMenu, setOpenModalMenu] = useState(false);

  // Edit states
  const [editingItem, setEditingItem] = useState<InstantItem | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editImageError, setEditImageError] = useState<string | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Double tap to like states
  const [doubleTapHeartId, setDoubleTapHeartId] = useState<string | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent, item: InstantItem) => {
    e.stopPropagation();
    setDoubleTapHeartId(item.id);
    setTimeout(() => {
      setDoubleTapHeartId((curr) => (curr === item.id ? null : curr));
    }, 900);

    const hasLiked = item.likes?.includes(userId);
    if (!hasLiked) {
      handleToggleLike(e as any, item);
    }
  };

  const handleCardTouchOrClick = (item: InstantItem) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.id === item.id && now - lastTapRef.current.time < 350) {
      handleDoubleTap({ stopPropagation: () => {} } as any, item);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { id: item.id, time: now };
    }
  };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".instant-menu-container")) {
        setOpenMenuId(null);
      }
      if (!(e.target as HTMLElement).closest(".instant-modal-menu-container")) {
        setOpenModalMenu(false);
      }
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const fetchInstants = async () => {
    try {
      const res = await fetch(`/api/home/instants?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setInstants(data.instants || data.posts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchInstants();
  }, [userId]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this post?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/home/instants?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setInstants(prev => prev.filter(item => item.id !== id));
        if (activeItem?.id === id) setActiveItem(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (e: React.MouseEvent, item: InstantItem) => {
    e.stopPropagation();
    setEditingItem(item);
    setEditCaption(item.caption || "");
    setEditLocation(item.location || "");
    setEditImage(item.imageUrl || "");
    setEditImageError(null);
    setEditSuccess(null);
    setOpenMenuId(null);
    setOpenModalMenu(false);
  };

  // Upload or replace image
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setEditImageError("Image must be smaller than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setEditImageError("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setEditImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Edits
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editCaption.trim()) {
      setEditImageError("Post text cannot be empty");
      return;
    }

    setSubmittingEdit(true);
    setEditImageError(null);
    try {
      const res = await fetch("/api/home/instants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: editingItem.id,
          content: editCaption.trim(),
          locationName: editLocation.trim() || null,
          imageUrl: editImage.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInstants((prev) =>
          prev.map((i) =>
            i.id === editingItem.id
              ? {
                  ...i,
                  caption: editCaption.trim(),
                  location: editLocation.trim() || undefined,
                  imageUrl: editImage.trim() || undefined,
                }
              : i
          )
        );
        if (activeItem?.id === editingItem.id) {
          setActiveItem((prev) =>
            prev
              ? {
                  ...prev,
                  caption: editCaption.trim(),
                  location: editLocation.trim() || undefined,
                  imageUrl: editImage.trim() || undefined,
                }
              : null
          );
        }
        setEditSuccess("Post updated successfully!");
        setTimeout(() => {
          setEditingItem(null);
          setEditSuccess(null);
        }, 600);
      } else {
        setEditImageError(data.error || "Failed to update post");
      }
    } catch (err) {
      setEditImageError("Network error while saving");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, item: InstantItem) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/home/instants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setInstants(prev =>
          prev.map(i => (i.id === item.id ? { ...i, likesCount: data.likesCount, likes: data.likes } : i))
        );
        if (activeItem?.id === item.id) {
          setActiveItem(prev => (prev ? { ...prev, likesCount: data.likesCount, likes: data.likes } : null));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 animate-pulse">
        Loading Posts...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-xs">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
              {isOwn ? "My Posts" : `${userName || "Explorer"}'s Posts`}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {instants.length} post{instants.length === 1 ? "" : "s"} shared
            </p>
          </div>
        </div>

        {isOwn && (
          <Link
            href="/?tab=instants"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>+ Create Post</span>
          </Link>
        )}
      </div>

      {instants.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/80 dark:border-emerald-950/70">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500 mx-auto mb-2">
            <Camera className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isOwn ? "No Posts shared yet" : "No posts shared yet"}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
            {isOwn
              ? "Capture moments of your journeys and travels to showcase on your profile and community feed."
              : "This explorer hasn't posted any moments yet."}
          </p>
          {isOwn && (
            <Link
              href="/?tab=instants"
              className="mt-3 inline-flex px-4 py-1.5 rounded-full text-xs font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700/60 transition hover:scale-105"
            >
              Create First Post
            </Link>
          )}
        </div>
      ) : (
        /* Unique Mosaic Grid with Floating Cards */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-5">
          {instants.map(item => {
            const hasLiked = item.likes?.includes(userId);
            return (
              <div
                key={item.id}
                onClick={() => setActiveItem(item)}
                onDoubleClick={(e) => handleDoubleTap(e, item)}
                onTouchEnd={() => handleCardTouchOrClick(item)}
                className="group relative rounded-3xl overflow-hidden bg-[#0c1511] border border-emerald-950/60 dark:border-emerald-900/50 shadow-md hover:shadow-2xl hover:shadow-emerald-950/30 hover:border-emerald-500/60 transition-all duration-500 cursor-pointer flex flex-col aspect-[4/5] select-none"
              >
                {/* Double Tap Heart Burst Animation */}
                {doubleTapHeartId === item.id && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in fade-in zoom-in duration-150">
                    <div className="p-4 rounded-full bg-black/50 backdrop-blur-md shadow-2xl animate-bounce">
                      <Heart className="w-14 h-14 fill-rose-500 text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.9)]" />
                    </div>
                  </div>
                )}
                {/* Image Cover or Stylized Memory Canvas */}
                {item.imageUrl ? (
                  <div className="relative w-full h-full overflow-hidden bg-slate-950">
                    <img
                      src={item.imageUrl}
                      alt={item.caption || "Instant"}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    />
                    {/* Multi-layer cinematic vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/30 opacity-90 group-hover:opacity-95 transition-opacity" />
                  </div>
                ) : (
                  /* Unique Field Dispatch Canvas with Aurora Glow & Compass Accent */
                  <div className="relative w-full h-full p-4 sm:p-5 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0d1c16] via-[#10271e] to-[#08120e]">
                    {/* Background Ambient Glow & Grid Watermark */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-400/25 transition-all duration-700" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Top spacer */}
                    <div className="h-6" />

                    {/* Quotation Body */}
                    <div className="relative z-10 my-auto space-y-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-serif font-black shadow-inner">
                        &ldquo;
                      </div>
                      <p className="text-xs sm:text-[13px] text-emerald-50 font-medium leading-relaxed tracking-wide line-clamp-5 drop-shadow-sm">
                        {item.caption}
                      </p>
                    </div>

                    {/* Bottom spacer */}
                    <div className="h-7" />
                  </div>
                )}

                {/* Top Location Pill */}
                {item.location && (
                  <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-white/10 shadow-lg group-hover:border-emerald-500/40 transition-colors">
                    <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    <span className="truncate max-w-[95px] tracking-tight">{item.location}</span>
                  </div>
                )}

                {/* Three dots button for author only */}
                {isOwn && (
                  <div className="absolute top-2.5 right-2.5 z-20 instant-menu-container">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === item.id ? null : item.id);
                      }}
                      className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 shadow-lg border border-white/10"
                      title="Options"
                      aria-label="Options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {openMenuId === item.id && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1.5 w-32 bg-[#121c17] rounded-2xl shadow-2xl border border-emerald-900/80 p-1.5 z-30 animate-fade-in space-y-0.5 text-left backdrop-blur-xl"
                      >
                        <button
                          type="button"
                          onClick={e => handleOpenEdit(e, item)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-[#1c2c24] hover:text-white transition rounded-xl"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            setOpenMenuId(null);
                            handleDelete(e, item.id);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition rounded-xl"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Overlay Info Pill */}
                <div className="absolute bottom-0 inset-x-0 p-3 z-10 text-white flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <div className="min-w-0 pr-2">
                    {item.imageUrl && item.caption && (
                      <p className="text-[11px] font-semibold truncate text-slate-200 drop-shadow-sm">
                        {item.caption}
                      </p>
                    )}
                    <p className="text-[9.5px] text-emerald-300/80 font-medium flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-emerald-400/80" />
                      <span>{formatTimeAgo(item.createdAt)}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={e => handleToggleLike(e, item)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all active:scale-95 shrink-0 border border-white/10"
                    title={hasLiked ? "Unlike" : "Like"}
                  >
                    <Heart className={`w-3 h-3 transition-transform ${hasLiked ? "fill-rose-500 text-rose-500 scale-110" : "text-white"}`} />
                    <span className="text-[10px] font-bold">{item.likesCount || 0}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal viewer for an instant */}
      {activeItem && (
        <div
          onClick={() => setActiveItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar bg-white dark:bg-[#111815] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-emerald-950/80 relative"
          >
            <button
              onClick={() => setActiveItem(null)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {activeItem.imageUrl && (
              <div className="relative w-full max-h-[60vh] bg-black flex items-center justify-center">
                <img
                  src={activeItem.imageUrl}
                  alt={activeItem.caption || "Instant"}
                  className="w-full max-h-[60vh] object-contain"
                />
              </div>
            )}

            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center">
                    {activeItem.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {activeItem.userName}
                    </h4>
                    {activeItem.location && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>{activeItem.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={e => handleToggleLike(e, activeItem)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition"
                  >
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    <span>{activeItem.likesCount || 0}</span>
                  </button>

                  {/* Three dots menu in viewer modal */}
                  {isOwn && (
                    <div className="relative instant-modal-menu-container">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setOpenModalMenu(!openModalMenu);
                        }}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
                        title="Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openModalMenu && (
                        <div
                          onClick={e => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#16201b] rounded-2xl shadow-2xl border border-slate-200 dark:border-emerald-950/80 p-1.5 z-30 space-y-0.5 text-left"
                        >
                          <button
                            type="button"
                            onClick={e => handleOpenEdit(e, activeItem)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f2d26] transition rounded-xl"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              setOpenModalMenu(false);
                              handleDelete(e, activeItem.id);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition rounded-xl"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {activeItem.caption && (
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                  {activeItem.caption}
                </p>
              )}

              <p className="text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-emerald-950/60 pt-2">
                Posted {formatTimeAgo(activeItem.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT INSTANT MODAL FOR ACCOUNT INSTANTS ── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar bg-white dark:bg-[#111815] rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-950 p-4 sm:p-6 space-y-4 relative">
            <button
              onClick={() => {
                setEditingItem(null);
                setEditImageError(null);
              }}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              title="Close editor"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/80 dark:border-amber-800/60 shadow-xs">
                <Pencil className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Edit Post</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Update your post caption, location coordinates, or photo
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Caption / Moment *
                </label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="What's happening?"
                  required
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Upload / Replace Photo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Photo (Optional)
                </label>
                {editImage ? (
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-emerald-950 bg-slate-900 shadow-inner group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editImage}
                      alt="Instant photo preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-slate-100 transition flex items-center gap-1.5">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Replace Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditImageUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditImage("")}
                        className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                    {/* Always visible mobile remove button */}
                    <button
                      type="button"
                      onClick={() => setEditImage("")}
                      className="sm:hidden absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition"
                      aria-label="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-emerald-950/80 bg-slate-50 dark:bg-[#16201b]/60 hover:bg-amber-50/40 dark:hover:bg-[#1c2822] hover:border-amber-400 dark:hover:border-amber-500/60 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Upload or replace photo
                      </p>
                      <p className="text-[10px] text-slate-400">
                        JPEG, PNG, WEBP up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
                {editImageError && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {editImageError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Location Tag (Optional)
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="e.g. Jubilee Hills, Hyderabad"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {editSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{editSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setEditImageError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18241f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit || !editCaption.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md transition disabled:opacity-50 active:scale-95"
                >
                  {submittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
