"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Camera,
  Sprout,
  Gem,
  Flame,
  Heart,
  MapPin,
  Calendar,
  Users,
  Send,
  Plus,
  Share2,
  Trash2,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Lock,
  Search,
  X,
  Loader2,
  Image as ImageIcon,
  UploadCloud,
  Globe,
  Radio,
  Key,
  Pencil,
  Compass,
  Quote,
  Repeat2,
  MoreVertical,
  MessageCircle,
  Reply,
  CornerDownRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatTimeAgo } from "@/lib/utils";
import { AvatarBadge } from "@/components/common/AvatarBadge";
import { getBadgeForRank, parseRankFromMembership } from "@/lib/badges";
import type { TreasureItem } from "@/components/home/TreasureMap";

// Dynamically import TreasureMap to avoid SSR Leaflet window errors
const TreasureMap = dynamic(
  () => import("@/components/home/TreasureMap").then((mod) => mod.TreasureMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[380px] sm:h-[460px] rounded-3xl bg-slate-100 dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 flex items-center justify-center text-xs text-slate-400 animate-pulse">
        Loading Explorer Map...
      </div>
    ),
  }
);

export type HomeTab = "instants" | "grow" | "treasure" | "find-me";

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorCity?: string | null;
  authorRank?: number | null;
  isVerified?: boolean;
  content: string;
  parentId?: string | null;
  replyToName?: string | null;
  createdAt: string;
}

interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorCity?: string | null;
  authorRank?: number | null;
  isVerified?: boolean;
  content: string;
  imageUrl?: string | null;
  locationName?: string | null;
  likesCount: number;
  likedBy: string[];
  repostsCount?: number;
  repostedBy?: string[];
  commentsCount?: number;
  comments?: PostComment[];
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
}

interface GrowInitiative {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string | null;
  organizerCity?: string | null;
  title: string;
  description: string;
  causeCategory: string;
  locationName: string;
  date?: string | null;
  volunteersNeeded: number;
  volunteersCount: number;
  joinedUserIds: string[];
  imageUrl?: string | null;
  createdAt: string;
}

interface FindMeClue {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string | null;
  creatorCity?: string | null;
  clueText: string;
  hintArea: string;
  vibeTag: string;
  photoHintUrl?: string | null;
  guessesCount: number;
  createdAt: string;
}

export default function HomeClient() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<HomeTab>("instants");

  // Data states
  const [instants, setInstants] = useState<CommunityPost[]>([]);
  const [growList, setGrowList] = useState<GrowInitiative[]>([]);
  const [treasures, setTreasures] = useState<TreasureItem[]>([]);
  const [findMeClues, setFindMeClues] = useState<FindMeClue[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [repostingId, setRepostingId] = useState<string | null>(null);
  const [joiningGrowId, setJoiningGrowId] = useState<string | null>(null);

  // Selected Treasure
  const [selectedTreasure, setSelectedTreasure] = useState<TreasureItem | null>(null);
  const [solveModalOpen, setSolveModalOpen] = useState(false);
  const [solveGuessInput, setSolveGuessInput] = useState("");
  const [solvingTreasure, setSolvingTreasure] = useState(false);
  const [solveFeedback, setSolveFeedback] = useState<string | null>(null);

  // Find Me Guess Modal
  const [selectedFindMe, setSelectedFindMe] = useState<FindMeClue | null>(null);
  const [guessAnswerInput, setGuessAnswerInput] = useState("");
  const [guessMessageInput, setGuessMessageInput] = useState("");
  const [submittingGuess, setSubmittingGuess] = useState(false);
  const [guessFeedback, setGuessFeedback] = useState<string | null>(null);

  // Create Modals
  const [isCreateInstantOpen, setIsCreateInstantOpen] = useState(false);
  const [isCreateGrowOpen, setIsCreateGrowOpen] = useState(false);
  const [isCreateTreasureOpen, setIsCreateTreasureOpen] = useState(false);
  const [isCreateFindMeOpen, setIsCreateFindMeOpen] = useState(false);

  // Auth gate modal for guest interactions
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  // Form states
  const [instantContent, setInstantContent] = useState("");
  const [instantLocation, setInstantLocation] = useState("");
  const [instantImage, setInstantImage] = useState("");
  const [instantImageError, setInstantImageError] = useState<string | null>(null);
  const [submittingInstant, setSubmittingInstant] = useState(false);

  // Edit Instant states
  const [editingInstant, setEditingInstant] = useState<CommunityPost | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editImageError, setEditImageError] = useState<string | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  // Comments UI states
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentInputMap, setCommentInputMap] = useState<Record<string, string>>({});
  const [replyTargetMap, setReplyTargetMap] = useState<Record<string, { id: string; name: string } | null>>({});
  const [submittingCommentPostId, setSubmittingCommentPostId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Double tap to like heart animation
  const [doubleTapHeartPostId, setDoubleTapHeartPostId] = useState<string | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".post-menu-container")) {
        setOpenMenuPostId(null);
      }
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const handleInstantImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInstantImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setInstantImageError("Image must be smaller than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setInstantImageError("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setInstantImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const [growTitle, setGrowTitle] = useState("");
  const [growDesc, setGrowDesc] = useState("");
  const [growCause, setGrowCause] = useState("CLEAN_OCEAN");
  const [growLocation, setGrowLocation] = useState("");
  const [growDate, setGrowDate] = useState("");
  const [growVolunteers, setGrowVolunteers] = useState("");
  const [submittingGrow, setSubmittingGrow] = useState(false);

  const [treasureTitle, setTreasureTitle] = useState("");
  const [treasureRiddle, setTreasureRiddle] = useState("");
  const [treasureLocation, setTreasureLocation] = useState("");
  const [treasureLat, setTreasureLat] = useState("");
  const [treasureLng, setTreasureLng] = useState("");
  const [treasureDifficulty, setTreasureDifficulty] = useState("MEDIUM");
  const [submittingTreasure, setSubmittingTreasure] = useState(false);

  const [findMeText, setFindMeText] = useState("");
  const [findMeArea, setFindMeArea] = useState("");
  const [findMeVibe, setFindMeVibe] = useState("Coffee & Books");
  const [submittingFindMe, setSubmittingFindMe] = useState(false);

  // Fetch data with instant cache and non-blocking background revalidation
  const fetchData = async () => {
    // 1. Instant cache retrieval for 0ms UI render
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("travally_instants_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInstants(parsed);
            setLoading(false);
          }
        }
      } catch {}
    }

    // 2. Fetch instants with highest priority (unblocks feed immediately)
    fetch("/api/home/instants")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.posts) {
          setInstants(d.posts);
          try {
            sessionStorage.setItem("travally_instants_cache", JSON.stringify(d.posts));
          } catch {}
        }
      })
      .catch((e) => console.error("Error loading posts:", e))
      .finally(() => setLoading(false));

    // 3. Fetch secondary tabs in parallel without blocking community posts
    fetch("/api/home/grow")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.initiatives) setGrowList(d.initiatives);
      })
      .catch(() => {});

    fetch("/api/home/treasure")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        const list = d?.treasures || [];
        setTreasures(list);
        if (list.length > 0) {
          setSelectedTreasure((prev) => prev || list[0]);
        }
      })
      .catch(() => {});

    fetch("/api/home/find-me")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.clues) setFindMeClues(d.clues);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Require auth or show prompt
  const requireAuth = (action: () => void) => {
    if (!currentUser) {
      setAuthPromptOpen(true);
      return;
    }
    action();
  };

  // Like Instant
  const handleLikeInstant = async (id: string) => {
    requireAuth(async () => {
      if (!currentUser) return;
      const currentUserId = currentUser.id;
      try {
        setLikingId(id);
        const res = await fetch("/api/home/instants", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: id }),
        });
        if (res.ok) {
          const data = await res.json();
          setInstants((prev) =>
            prev.map((p) => {
              if (p.id !== id) return p;
              const hasLiked = p.likedBy.includes(currentUserId);
              const updatedLikedBy = hasLiked
                ? p.likedBy.filter((uid) => uid !== currentUserId)
                : [...p.likedBy, currentUserId];
              return {
                ...p,
                likesCount: data.likesCount,
                likedBy: updatedLikedBy,
              };
            })
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLikingId(null);
      }
    });
  };

  // Repost Instant
  const handleRepostInstant = async (id: string) => {
    requireAuth(async () => {
      if (!currentUser) return;
      const currentUserId = currentUser.id;
      try {
        setRepostingId(id);
        const res = await fetch("/api/home/instants", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: id, action: "repost" }),
        });
        if (res.ok) {
          const data = await res.json();
          setInstants((prev) =>
            prev.map((p) => {
              if (p.id !== id) return p;
              const repostedBy = Array.isArray(p.repostedBy) ? p.repostedBy : [];
              const hasReposted = repostedBy.includes(currentUserId);
              const updatedRepostedBy = hasReposted
                ? repostedBy.filter((uid) => uid !== currentUserId)
                : [...repostedBy, currentUserId];
              return {
                ...p,
                repostsCount: data.repostsCount ?? updatedRepostedBy.length,
                repostedBy: updatedRepostedBy,
              };
            })
          );
        }
      } catch (err) {
        console.error("Failed to repost:", err);
      } finally {
        setRepostingId(null);
      }
    });
  };

  // Double tap to like handler
  const handleDoubleTap = (postId: string) => {
    setDoubleTapHeartPostId(postId);
    setTimeout(() => {
      setDoubleTapHeartPostId((curr) => (curr === postId ? null : curr));
    }, 900);

    const post = instants.find((p) => p.id === postId);
    if (post) {
      const hasLiked = currentUser ? post.likedBy?.includes(currentUser.id) : false;
      if (!hasLiked) {
        handleLikeInstant(postId);
      }
    }
  };

  const handleCardTouchOrClick = (postId: string) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.id === postId && now - lastTapRef.current.time < 350) {
      handleDoubleTap(postId);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { id: postId, time: now };
    }
  };

  // Comments handlers
  const toggleComments = (postId: string) => {
    setOpenCommentsPostId((prev) => (prev === postId ? null : postId));
  };

  const handleCommentInputChange = (postId: string, val: string) => {
    setCommentInputMap((prev) => ({ ...prev, [postId]: val }));
  };

  const handleSetReplyTarget = (postId: string, commentId: string, authorName: string) => {
    setReplyTargetMap((prev) => ({ ...prev, [postId]: { id: commentId, name: authorName } }));
  };

  const handleCancelReply = (postId: string) => {
    setReplyTargetMap((prev) => ({ ...prev, [postId]: null }));
  };

  const handleSubmitComment = async (postId: string) => {
    if (!currentUser) {
      setAuthPromptOpen(true);
      return;
    }

    const text = (commentInputMap[postId] || "").trim();
    if (!text) return;

    const replyTarget = replyTargetMap[postId];
    setSubmittingCommentPostId(postId);

    try {
      const res = await fetch("/api/home/instants/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: text,
          parentId: replyTarget ? replyTarget.id : null,
          replyToName: replyTarget ? replyTarget.name : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setInstants((prev) =>
            prev.map((p) => {
              if (p.id === postId) {
                const updated = [...(p.comments || []), data.comment];
                return {
                  ...p,
                  comments: updated,
                  commentsCount: data.commentsCount || updated.length,
                };
              }
              return p;
            })
          );
          setCommentInputMap((prev) => ({ ...prev, [postId]: "" }));
          setReplyTargetMap((prev) => ({ ...prev, [postId]: null }));
        }
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setSubmittingCommentPostId(null);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!currentUser) return;
    setDeletingCommentId(commentId);
    try {
      const res = await fetch(`/api/home/instants/comments?postId=${postId}&commentId=${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInstants((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              const updated = (p.comments || []).filter(
                (c) => c.id !== commentId && c.parentId !== commentId
              );
              return {
                ...p,
                comments: updated,
                commentsCount: Math.max(0, updated.length),
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Delete Instant / Post
  const handleDeleteInstant = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/home/instants?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setInstants((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (post: CommunityPost) => {
    setEditingInstant(post);
    setEditContent(post.content);
    setEditLocation(post.locationName || "");
    setEditImage(post.imageUrl || "");
    setEditImageError(null);
    setEditSuccessMsg(null);
  };

  // Upload or change image inside Edit Modal
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

  // Save Edits to Post
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstant) return;
    if (!editContent.trim()) {
      setEditImageError("Post content cannot be empty");
      return;
    }

    setSubmittingEdit(true);
    setEditImageError(null);
    try {
      const res = await fetch("/api/home/instants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: editingInstant.id,
          content: editContent.trim(),
          locationName: editLocation.trim() || null,
          imageUrl: editImage.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInstants((prev) =>
          prev.map((p) =>
            p.id === editingInstant.id
              ? {
                  ...p,
                  content: editContent.trim(),
                  locationName: editLocation.trim() || null,
                  imageUrl: editImage.trim() || null,
                  isEdited: true,
                  updatedAt: new Date().toISOString(),
                }
              : p
          )
        );
        setEditSuccessMsg("Dispatch updated successfully!");
        setTimeout(() => {
          setEditingInstant(null);
          setEditSuccessMsg(null);
        }, 600);
      } else {
        setEditImageError(data.error || "Failed to save edits");
      }
    } catch (err) {
      setEditImageError("Network error while saving edits");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Share Dispatch link
  const handleShareDispatch = (postId: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/?tab=instants&post=${postId}`);
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId(null), 2200);
    }
  };

  // Create Instant
  const handleCreateInstant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instantContent.trim()) return;
    setSubmittingInstant(true);
    try {
      const res = await fetch("/api/home/instants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: instantContent.trim(),
          locationName: instantLocation.trim() || undefined,
          imageUrl: instantImage.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setInstants((prev) => [data.post, ...prev]);
        setInstantContent("");
        setInstantLocation("");
        setInstantImage("");
        setInstantImageError(null);
        setIsCreateInstantOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingInstant(false);
    }
  };

  // Join / Leave Grow
  const handleToggleJoinGrow = async (id: string) => {
    requireAuth(async () => {
      if (!currentUser) return;
      const currentUserId = currentUser.id;
      try {
        setJoiningGrowId(id);
        const res = await fetch("/api/home/grow", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initiativeId: id }),
        });
        if (res.ok) {
          const data = await res.json();
          setGrowList((prev) =>
            prev.map((g) => {
              if (g.id !== id) return g;
              const hasJoined = g.joinedUserIds.includes(currentUserId);
              const updated = hasJoined
                ? g.joinedUserIds.filter((uid) => uid !== currentUserId)
                : [...g.joinedUserIds, currentUserId];
              return {
                ...g,
                joinedUserIds: updated,
                volunteersCount: data.volunteersCount,
              };
            })
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setJoiningGrowId(null);
      }
    });
  };

  // Create Grow
  const handleCreateGrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!growTitle.trim() || !growDesc.trim() || !growLocation.trim()) return;
    setSubmittingGrow(true);
    try {
      const res = await fetch("/api/home/grow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: growTitle.trim(),
          description: growDesc.trim(),
          causeCategory: growCause,
          locationName: growLocation.trim(),
          date: growDate || undefined,
          volunteersNeeded: Number(growVolunteers) || 10,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGrowList((prev) => [data.initiative, ...prev]);
        setGrowTitle("");
        setGrowDesc("");
        setGrowLocation("");
        setGrowDate("");
        setIsCreateGrowOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingGrow(false);
    }
  };

  // Create Treasure
  const handleCreateTreasure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treasureTitle.trim() || !treasureRiddle.trim()) return;
    setSubmittingTreasure(true);
    try {
      const res = await fetch("/api/home/treasure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: treasureTitle.trim(),
          hintRiddle: treasureRiddle.trim(),
          latitude: parseFloat(treasureLat) || 17.385,
          longitude: parseFloat(treasureLng) || 78.4867,
          locationName: treasureLocation.trim() || "Secret Geo Spot",
          difficulty: treasureDifficulty,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTreasures((prev) => [data.treasure, ...prev]);
        setSelectedTreasure(data.treasure);
        setTreasureTitle("");
        setTreasureRiddle("");
        setTreasureLocation("");
        setIsCreateTreasureOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingTreasure(false);
    }
  };

  // Submit Treasure Solve
  const handleSolveTreasure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTreasure || !solveGuessInput.trim()) return;
    setSolvingTreasure(true);
    setSolveFeedback(null);
    try {
      const res = await fetch("/api/home/treasure", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treasureId: selectedTreasure.id,
          solutionGuess: solveGuessInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSolveFeedback(data.message || "Treasure solved successfully!");
        setTreasures((prev) =>
          prev.map((t) =>
            t.id === selectedTreasure.id
              ? {
                  ...t,
                  solversCount: data.solversCount,
                  solvedUserIds: [...t.solvedUserIds, currentUser?.id || ""],
                }
              : t
          )
        );
        setTimeout(() => {
          setSolveModalOpen(false);
          setSolveGuessInput("");
          setSolveFeedback(null);
        }, 1800);
      } else {
        setSolveFeedback(data.error || "That didn't quite match. Try again!");
      }
    } catch (err) {
      setSolveFeedback("Network error. Please try again.");
    } finally {
      setSolvingTreasure(false);
    }
  };

  // Create Find Me
  const handleCreateFindMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findMeText.trim() || !findMeArea.trim()) return;
    setSubmittingFindMe(true);
    try {
      const res = await fetch("/api/home/find-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clueText: findMeText.trim(),
          hintArea: findMeArea.trim(),
          vibeTag: findMeVibe,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFindMeClues((prev) => [data.clue, ...prev]);
        setFindMeText("");
        setFindMeArea("");
        setIsCreateFindMeOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFindMe(false);
    }
  };

  // Submit Find Me Guess / Date Request
  const handleSubmitFindMeGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFindMe || !guessAnswerInput.trim()) return;
    setSubmittingGuess(true);
    setGuessFeedback(null);
    try {
      const res = await fetch("/api/home/find-me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clueId: selectedFindMe.id,
          answerGuess: guessAnswerInput.trim(),
          customMessage: guessMessageInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGuessFeedback(data.message || "Clue guess submitted! Creator notified.");
        setFindMeClues((prev) =>
          prev.map((c) =>
            c.id === selectedFindMe.id ? { ...c, guessesCount: c.guessesCount + 1 } : c
          )
        );
        setTimeout(() => {
          setSelectedFindMe(null);
          setGuessAnswerInput("");
          setGuessMessageInput("");
          setGuessFeedback(null);
        }, 1800);
      } else {
        setGuessFeedback(data.error || "Could not submit guess.");
      }
    } catch (err) {
      setGuessFeedback("Error submitting guess.");
    } finally {
      setSubmittingGuess(false);
    }
  };

  const tabs = [
    {
      id: "instants" as const,
      label: "Posts",
      shortLabel: "Posts",
      icon: Camera,
      color: "from-amber-400 to-orange-500",
      activeBg: "bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950/80 dark:to-amber-900/60 text-orange-900 dark:text-orange-200 border-orange-300/80 dark:border-orange-700/60",
    },
    {
      id: "grow" as const,
      label: "Grow",
      shortLabel: "Grow",
      icon: Sprout,
      color: "from-emerald-400 to-teal-500",
      activeBg: "bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950/80 dark:to-teal-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-300/80 dark:border-emerald-700/60",
    },
    {
      id: "treasure" as const,
      label: "Treasure Quest",
      shortLabel: "Treasure",
      icon: Gem,
      color: "from-blue-400 to-indigo-500",
      activeBg: "bg-gradient-to-r from-blue-100 via-indigo-50 to-blue-100 dark:from-blue-950/80 dark:to-indigo-900/60 text-blue-900 dark:text-blue-200 border-blue-300/80 dark:border-blue-700/60",
    },
    {
      id: "find-me" as const,
      label: "Find Me",
      shortLabel: "Find Me",
      icon: Flame,
      color: "from-pink-400 to-rose-500",
      activeBg: "bg-gradient-to-r from-rose-100 via-pink-50 to-rose-100 dark:from-rose-950/80 dark:to-pink-900/60 text-rose-900 dark:text-rose-200 border-rose-300/80 dark:border-rose-700/60",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d0b] text-slate-900 dark:text-slate-100 relative overflow-hidden pb-24 font-sans select-none">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[25%] left-[-10%] w-[45%] h-[45%] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-12 relative z-10 space-y-4 sm:space-y-6">
        
        {/* Top Community Subheader & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/80 dark:border-emerald-950/60 pb-3.5 sm:pb-5">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Explore What&apos;s Happening
            </h1>
          </div>

          {/* Quick Create Action linking directly to Unified Create Hub */}
          <div className="shrink-0">
            {activeTab === "instants" && (
              <Link
                href="/activities/create?type=instant"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Create Post</span>
              </Link>
            )}
            {activeTab === "grow" && (
              <Link
                href="/activities/create?type=grow"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <Sprout className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Start Grow Cause</span>
              </Link>
            )}
            {activeTab === "treasure" && (
              <Link
                href="/activities/create?type=treasure"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <Gem className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Hide a Treasure</span>
              </Link>
            )}
            {activeTab === "find-me" && (
              <Link
                href="/activities/create?type=find-me"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Drop a Clue</span>
              </Link>
            )}
          </div>
        </div>

        {/* 4 Feature Segments - Perfectly Responsive 4-Column Grid */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-3 rounded-2xl text-[11px] sm:text-sm font-bold border transition-all text-center select-none ${
                  isActive
                    ? `${tab.activeBg} shadow-xs font-black`
                    : "bg-white dark:bg-[#111815] border-slate-200 dark:border-emerald-950/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#15201b]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? "text-current" : "text-slate-400"}`} />
                <span className="truncate max-w-full">
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: INSTANTS (REAL COMMUNITY FEED) ── */}
        {activeTab === "instants" && (
          <div className="space-y-4">
            {loading && instants.length === 0 ? (
              <div className="columns-1 md:columns-2 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="break-inside-avoid mb-4 p-5 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/80 dark:border-emerald-950/70 animate-pulse space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
                        <div className="h-2 w-20 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-2 py-1">
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full" />
                      <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800/80 rounded-full" />
                    </div>
                    {n % 2 === 0 && (
                      <div className="h-44 w-full bg-slate-200/80 dark:bg-slate-800 rounded-2xl" />
                    )}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-emerald-950/60 flex items-center justify-between">
                      <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
                      <div className="h-6 w-8 bg-slate-100 dark:bg-slate-800 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : instants.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/70 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Posts Posted Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Be the first explorer to share a post, spontaneous moment, meetup recap, or local travel photo with the community!
                </p>
                <div className="pt-4">
                  <Link
                    href="/activities/create?type=instant"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-md hover:from-orange-600 hover:to-amber-600 transition active:scale-95"
                  >
                    Create First Post
                  </Link>
                </div>
              </div>
            ) : (
              <div className="columns-1 md:columns-2 gap-4 [column-fill:_balance]">
                {instants.map((post) => {
                  const hasLiked = currentUser ? post.likedBy.includes(currentUser.id) : false;
                  const hasReposted = currentUser ? (post.repostedBy || []).includes(currentUser.id) : false;
                  const isAuthor = currentUser?.id === post.authorId;
                  const rank = post.authorRank || 1;
                  const badge = getBadgeForRank(rank);

                  return (
                    <article
                      key={post.id}
                      onDoubleClick={() => handleDoubleTap(post.id)}
                      className="break-inside-avoid mb-4 inline-block w-full align-top group relative rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/90 dark:border-emerald-950/70 p-4 sm:p-5 shadow-sm hover:shadow-xl hover:shadow-emerald-950/10 hover:border-emerald-500/50 dark:hover:border-emerald-600/50 transition-all duration-300 overflow-hidden"
                    >
                      {/* Double Tap Heart Burst Animation */}
                      {doubleTapHeartPostId === post.id && (
                        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in fade-in zoom-in duration-150">
                          <div className="p-4 rounded-full bg-black/50 backdrop-blur-md shadow-2xl animate-bounce">
                            <Heart className="w-14 h-14 sm:w-16 sm:h-16 fill-rose-500 text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.9)]" />
                          </div>
                        </div>
                      )}
                      {/* Top Explorer Accent Stripe */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />

                      <div className="space-y-3">
                        {/* Author Header Row with Three Dots menu (for author only) */}
                        <div className="flex items-center justify-between gap-3">
                          <Link
                            href={isAuthor ? "/profile" : `/profile?userId=${post.authorId}`}
                            className="flex items-center gap-2.5 min-w-0 group/author"
                          >
                            <AvatarBadge
                              src={post.authorAvatar}
                              name={post.authorName}
                              rank={rank}
                              badge={badge}
                              size="md"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover/author:text-emerald-600 dark:group-hover/author:text-emerald-400 transition-colors">
                                  {post.authorName}
                                </h4>
                                {post.isVerified && (
                                  <span title="Verified Explorer">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
                                {post.locationName && (
                                  <>
                                    <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[130px] sm:max-w-[180px]">
                                      <MapPin className="w-3 h-3 shrink-0" />
                                      <span className="truncate">{post.locationName}</span>
                                    </span>
                                    <span>•</span>
                                  </>
                                )}
                                <span>{formatTimeAgo(post.createdAt)}</span>
                              </div>
                            </div>
                          </Link>

                          {/* Three Dots Button: ONLY visible to author */}
                          {isAuthor && (
                            <div className="relative post-menu-container shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuPostId(openMenuPostId === post.id ? null : post.id);
                                }}
                                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2620] transition active:scale-95"
                                title="More options"
                                aria-label="More options"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* Dropdown Menu */}
                              {openMenuPostId === post.id && (
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#16201b] rounded-2xl shadow-xl border border-slate-200 dark:border-emerald-950/80 p-1.5 z-30 animate-fade-in space-y-0.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuPostId(null);
                                      handleOpenEdit(post);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f2d26] transition rounded-xl text-left"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuPostId(null);
                                      handleDeleteInstant(post.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition rounded-xl text-left"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 3. Field Note Observation (Text) */}
                        <div className="relative pl-3 border-l-2 border-amber-400/80 dark:border-amber-500/80 py-0.5">
                          <p className="text-xs sm:text-[13.5px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
                            {post.content}
                          </p>
                        </div>

                        {/* 4. Expedition Photo (if attached) */}
                        {post.imageUrl && (
                          <div
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleDoubleTap(post.id);
                            }}
                            onTouchEnd={() => {
                              handleCardTouchOrClick(post.id);
                            }}
                            className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-emerald-950/80 bg-slate-100 dark:bg-slate-900 group/img cursor-pointer select-none"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={post.imageUrl}
                              alt="Expedition capture"
                              className="w-full max-h-72 object-cover group-hover/img:scale-[1.02] transition-transform duration-500 ease-out"
                            />
                            {post.locationName && (
                              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white border border-white/10 shadow-lg">
                                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="truncate max-w-[200px]">{post.locationName}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 5. Explorer Interaction Dock */}
                        <div className="pt-2.5 border-t border-slate-100 dark:border-emerald-950/60 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Like Button (icon + count only, NO text) */}
                            <button
                              type="button"
                              onClick={() => handleLikeInstant(post.id)}
                              disabled={likingId === post.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all active:scale-95 font-bold text-xs ${
                                hasLiked
                                  ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 shadow-xs"
                                  : "bg-slate-50 dark:bg-[#16201b] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-emerald-950/80 hover:border-rose-300 dark:hover:border-rose-900/60 hover:text-rose-600 dark:hover:text-rose-400"
                              }`}
                              title={hasLiked ? "Unlike" : "Like"}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 transition-transform ${
                                  hasLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
                                }`}
                              />
                              <span>{post.likesCount || 0}</span>
                            </button>

                            {/* Repost Button (icon + count only, NO text) */}
                            <button
                              type="button"
                              onClick={() => handleRepostInstant(post.id)}
                              disabled={repostingId === post.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all active:scale-95 font-bold text-xs ${
                                hasReposted
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 shadow-xs"
                                  : "bg-slate-50 dark:bg-[#16201b] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-emerald-950/80 hover:border-emerald-300 dark:hover:border-emerald-900/60 hover:text-emerald-600 dark:hover:text-emerald-400"
                              }`}
                              title={hasReposted ? "Undo Repost" : "Repost"}
                            >
                              <Repeat2
                                className={`w-3.5 h-3.5 transition-transform ${
                                  hasReposted ? "text-emerald-600 dark:text-emerald-400 scale-110 stroke-[2.5]" : ""
                                }`}
                              />
                              <span>{post.repostsCount || 0}</span>
                            </button>

                            {/* Comment Button */}
                            <button
                              type="button"
                              onClick={() => toggleComments(post.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all active:scale-95 font-bold text-xs ${
                                openCommentsPostId === post.id
                                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800 shadow-xs"
                                  : "bg-slate-50 dark:bg-[#16201b] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-emerald-950/80 hover:border-blue-300 dark:hover:border-blue-900/60 hover:text-blue-600 dark:hover:text-blue-400"
                              }`}
                              title="Comments"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{post.commentsCount || (post.comments?.length) || 0}</span>
                            </button>
                          </div>

                          {/* Share Button (icon only, NO text) */}
                          <button
                            type="button"
                            onClick={() => handleShareDispatch(post.id)}
                            className="inline-flex items-center justify-center p-2 rounded-full bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c2822] hover:text-emerald-600 dark:hover:text-emerald-400 transition active:scale-95 font-semibold text-xs"
                            title="Share"
                          >
                            {copiedPostId === post.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* 6. Expandable Comments & Replies Section */}
                        {openCommentsPostId === post.id && (
                          <div className="pt-3 border-t border-slate-100 dark:border-emerald-950/60 space-y-3 animate-in fade-in duration-200">
                            {/* Comments Header */}
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-bold text-[11px] uppercase tracking-wider">
                                Comments ({post.comments?.length || post.commentsCount || 0})
                              </span>
                              <button
                                type="button"
                                onClick={() => setOpenCommentsPostId(null)}
                                className="text-[11px] hover:text-slate-700 dark:hover:text-slate-200 font-semibold"
                              >
                                Hide
                              </button>
                            </div>

                            {/* Comments List */}
                            {(!post.comments || post.comments.length === 0) ? (
                              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2 text-center">
                                No comments yet. Be the first to start the conversation!
                              </p>
                            ) : (
                              <div className="space-y-2.5 max-h-80 overflow-y-auto no-scrollbar pr-0.5">
                                {post.comments
                                  .filter((c) => !c.parentId)
                                  .map((comment) => {
                                    const replies = (post.comments || []).filter(
                                      (r) => r.parentId === comment.id
                                    );
                                    const isCommentAuthor = currentUser?.id === comment.authorId;
                                    const isPostAuthor = currentUser?.id === post.authorId;
                                    const canDelete = isCommentAuthor || isPostAuthor || currentUser?.role === "ADMIN";

                                    return (
                                      <div
                                        key={comment.id}
                                        className="rounded-2xl bg-slate-50/80 dark:bg-[#151f1a]/80 p-3 border border-slate-100 dark:border-emerald-950/60 space-y-2 text-xs"
                                      >
                                        {/* Comment Author Header */}
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 overflow-hidden">
                                              {comment.authorAvatar ? (
                                                <img
                                                  src={comment.authorAvatar}
                                                  alt={comment.authorName}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                comment.authorName.charAt(0).toUpperCase()
                                              )}
                                            </div>
                                            <div className="min-w-0">
                                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block text-[11.5px]">
                                                {comment.authorName}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
                                            <span>{formatTimeAgo(comment.createdAt)}</span>
                                            {canDelete && (
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteComment(post.id, comment.id)}
                                                disabled={deletingCommentId === comment.id}
                                                className="p-1 hover:text-rose-500 transition rounded"
                                                title="Delete comment"
                                              >
                                                {deletingCommentId === comment.id ? (
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                  <Trash2 className="w-3 h-3" />
                                                )}
                                              </button>
                                            )}
                                          </div>
                                        </div>

                                        {/* Comment Content */}
                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-8">
                                          {comment.content}
                                        </p>

                                        {/* Reply Trigger Button */}
                                        <div className="pl-8 flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleSetReplyTarget(post.id, comment.id, comment.authorName)}
                                            className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
                                          >
                                            <Reply className="w-3 h-3" />
                                            <span>Reply</span>
                                          </button>
                                        </div>

                                        {/* Nested Replies */}
                                        {replies.length > 0 && (
                                          <div className="ml-8 pl-3 border-l-2 border-emerald-500/20 space-y-2 mt-2">
                                            {replies.map((reply) => {
                                              const isReplyAuthor = currentUser?.id === reply.authorId;
                                              const canDeleteReply = isReplyAuthor || isPostAuthor || currentUser?.role === "ADMIN";

                                              return (
                                                <div
                                                  key={reply.id}
                                                  className="rounded-xl bg-white/70 dark:bg-[#1a2620]/70 p-2.5 border border-slate-100 dark:border-emerald-950/40 space-y-1.5"
                                                >
                                                  <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[9px] flex items-center justify-center shrink-0 overflow-hidden">
                                                        {reply.authorAvatar ? (
                                                          <img
                                                            src={reply.authorAvatar}
                                                            alt={reply.authorName}
                                                            className="w-full h-full object-cover"
                                                          />
                                                        ) : (
                                                          reply.authorName.charAt(0).toUpperCase()
                                                        )}
                                                      </div>
                                                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                                                        {reply.authorName}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 shrink-0">
                                                      <span>{formatTimeAgo(reply.createdAt)}</span>
                                                      {canDeleteReply && (
                                                        <button
                                                          type="button"
                                                          onClick={() => handleDeleteComment(post.id, reply.id)}
                                                          disabled={deletingCommentId === reply.id}
                                                          className="p-0.5 hover:text-rose-500 transition rounded"
                                                          title="Delete reply"
                                                        >
                                                          {deletingCommentId === reply.id ? (
                                                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                                          ) : (
                                                            <Trash2 className="w-2.5 h-2.5" />
                                                          )}
                                                        </button>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-6">
                                                    {reply.replyToName && (
                                                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold mr-1">
                                                        @{reply.replyToName}
                                                      </span>
                                                    )}
                                                    {reply.content}
                                                  </p>
                                                  <div className="pl-6">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleSetReplyTarget(post.id, comment.id, reply.authorName)}
                                                      className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                                                    >
                                                      Reply
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}

                            {/* Comment Input Box */}
                            <div className="pt-2 border-t border-slate-100 dark:border-emerald-950/60 space-y-1.5">
                              {/* Replying banner if active */}
                              {replyTargetMap[post.id] && (
                                <div className="flex items-center justify-between px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10.5px] text-emerald-800 dark:text-emerald-300 font-semibold">
                                  <div className="flex items-center gap-1">
                                    <CornerDownRight className="w-3 h-3 text-emerald-600" />
                                    <span>Replying to <strong>@{replyTargetMap[post.id]?.name}</strong></span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelReply(post.id)}
                                    className="p-0.5 hover:text-slate-700 dark:hover:text-white"
                                    title="Cancel reply"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              {/* Input Row */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={commentInputMap[post.id] || ""}
                                  onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSubmitComment(post.id);
                                    }
                                  }}
                                  placeholder={
                                    currentUser
                                      ? replyTargetMap[post.id]
                                        ? `Reply to @${replyTargetMap[post.id]?.name}...`
                                        : "Write a comment..."
                                      : "Log in to join the conversation..."
                                  }
                                  className="flex-1 px-3.5 py-2 rounded-full text-xs bg-slate-100 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSubmitComment(post.id)}
                                  disabled={submittingCommentPostId === post.id || !(commentInputMap[post.id] || "").trim()}
                                  className="p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm shrink-0"
                                  title="Send comment"
                                >
                                  {submittingCommentPostId === post.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Send className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: GROW (OCEAN CLEANING, NATURE & HUMANITY) ── */}
        {activeTab === "grow" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-16 text-xs text-slate-400">Loading Grow initiatives...</div>
            ) : growList.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/70 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Sprout className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Grow Initiatives Active Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Start an initiative to clean a beach, plant trees, assist nature, or help humanity together with fellow travelers!
                </p>
                <div className="pt-4">
                  <Link
                    href="/activities/create?type=grow"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md hover:from-emerald-700 hover:to-teal-700 transition active:scale-95"
                  >
                    Start First Initiative
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {growList.map((item) => {
                  const hasJoined = currentUser ? item.joinedUserIds.includes(currentUser.id) : false;
                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-[#111815] rounded-3xl border border-slate-200/90 dark:border-emerald-950/70 p-5 shadow-sm space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {item.causeCategory.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Organized by {item.organizerName}
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {item.title}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {item.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-orange-500" />
                            {item.locationName}
                          </span>
                          {item.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Volunteer Counter & Button */}
                      <div className="pt-3 border-t border-slate-100 dark:border-emerald-950/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.volunteersCount}
                          </span>
                          <span>/ {item.volunteersNeeded} volunteers joined</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleJoinGrow(item.id)}
                          disabled={joiningGrowId === item.id}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                            hasJoined
                              ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                              : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                          }`}
                        >
                          {hasJoined ? "✓ Joined Volunteer" : "Volunteer / Join"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: TREASURE FIND (INTERACTIVE MAP & GEOCACHING) ── */}
        {activeTab === "treasure" && (
          <div className="space-y-4">
            {/* Map Header */}
            <div className="bg-white dark:bg-[#111815] rounded-3xl border border-slate-200/90 dark:border-emerald-950/70 p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Gem className="w-5 h-5 text-amber-500" />
                    <span>Treasure Map Quest</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any marker on the map to view the riddle clue and claim the location!
                  </p>
                </div>

                <Link
                  href="/activities/create?type=treasure"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Hide New Treasure</span>
                </Link>
              </div>

              {/* The Map Component */}
              <TreasureMap
                treasures={treasures}
                selectedTreasure={selectedTreasure}
                onSelectTreasure={(t) => setSelectedTreasure(t)}
              />
            </div>

            {/* Selected Treasure Clue Card */}
            {selectedTreasure ? (
              <div className="bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 dark:from-[#161a14] dark:to-[#111815] rounded-3xl border border-amber-200/80 dark:border-amber-900/40 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                      {selectedTreasure.difficulty} QUEST
                    </span>
                    <span className="text-xs text-slate-500">
                      Hidden by {selectedTreasure.creatorName}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    {selectedTreasure.solversCount} Explorers Found
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedTreasure.title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>{selectedTreasure.locationName}</span>
                    <span className="font-mono text-[11px] text-slate-400 ml-2">
                      ({selectedTreasure.latitude.toFixed(4)}, {selectedTreasure.longitude.toFixed(4)})
                    </span>
                  </div>
                </div>

                {/* Riddle Box */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#131c18] border border-amber-200/60 dark:border-amber-900/40 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed italic">
                  &ldquo;{selectedTreasure.hintRiddle}&rdquo;
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => requireAuth(() => setSolveModalOpen(true))}
                    className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md transition"
                  >
                    Solve & Claim Spot
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Select a marker on the map to inspect its clue riddle!
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: FIND ME (MYSTERY DATING & COMPANION GAME) ── */}
        {activeTab === "find-me" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-orange-500/10 dark:from-rose-950/40 dark:to-pink-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
                  Mystery Explorer Matchmaking
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  Find Me: Solve the Clue & Connect
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md leading-relaxed">
                  A user drops a subtle clue about where they are or love to hang out. If you guess correctly, you unlock a direct dating connection!
                </p>
              </div>

              <Link
                href="/activities/create?type=find-me"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-md transition shrink-0 active:scale-95"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Post Your Clue</span>
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-16 text-xs text-slate-400">Loading Find Me clues...</div>
            ) : findMeClues.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/70 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-3">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Active Clues Dropped Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Be the first to post a mystery clue! Let fellow explorers guess your spot and connect for a date.
                </p>
                <div className="pt-4">
                  <Link
                    href="/activities/create?type=find-me"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 shadow-md hover:from-rose-600 hover:to-pink-600 transition active:scale-95"
                  >
                    Drop First Clue
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {findMeClues.map((clue) => {
                  const isCreator = currentUser?.id === clue.creatorId;
                  return (
                    <div
                      key={clue.id}
                      className="bg-white dark:bg-[#111815] rounded-3xl border border-slate-200/90 dark:border-emerald-950/70 p-5 shadow-sm space-y-4 hover:border-rose-400/40 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            ✨ {clue.vibeTag}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatTimeAgo(clue.createdAt)}
                          </span>
                        </div>

                        {/* Clue Prompt */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/60 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            Mystery Clue:
                          </span>
                          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed italic">
                            &ldquo;{clue.clueText}&rdquo;
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>Vicinity Area: <strong className="text-slate-700 dark:text-slate-200">{clue.hintArea}</strong></span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-emerald-950/60 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {clue.guessesCount} Guesses Received
                        </span>

                        {!isCreator ? (
                          <button
                            type="button"
                            onClick={() => requireAuth(() => setSelectedFindMe(clue))}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 transition shadow-xs"
                          >
                            💘 I Know! Guess & Date
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600">
                            Your Clue (Active)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL 1: POST INSTANT ── */}
      {isCreateInstantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar bg-white dark:bg-[#111815] rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-950 p-4 sm:p-6 space-y-4 relative">
            <button
              onClick={() => {
                setIsCreateInstantOpen(false);
                setInstantImageError(null);
              }}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-orange-500" />
              <span>Create a Post</span>
            </h3>
            <form onSubmit={handleCreateInstant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  What&apos;s happening? *
                </label>
                <textarea
                  value={instantContent}
                  onChange={(e) => setInstantContent(e.target.value)}
                  placeholder="Share a photo moment, local food spot, or spontaneous thought with the community..."
                  required
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>

              {/* Upload Photo Dropzone / Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Upload Photo (Optional)
                </label>
                {instantImage ? (
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-emerald-950 bg-slate-900 shadow-inner group">
                    <img
                      src={instantImage}
                      alt="Uploaded instant preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-slate-100 transition flex items-center gap-1.5">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Change</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleInstantImageUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setInstantImage("")}
                        className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                    {/* Always visible mobile remove button */}
                    <button
                      type="button"
                      onClick={() => setInstantImage("")}
                      className="sm:hidden absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition"
                      aria-label="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-slate-300 dark:border-emerald-950/80 bg-slate-50 dark:bg-[#16201b]/60 hover:bg-orange-50/40 dark:hover:bg-[#1c2822] hover:border-orange-400 dark:hover:border-orange-500/60 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Click or tap to upload photo
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        JPEG, PNG, WEBP, GIF up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleInstantImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
                {instantImageError && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {instantImageError}
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
                    value={instantLocation}
                    onChange={(e) => setInstantLocation(e.target.value)}
                    placeholder="e.g. Jubilee Hills, Hyderabad"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateInstantOpen(false);
                    setInstantImageError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18241f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInstant || !instantContent.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-md transition disabled:opacity-50"
                >
                  {submittingInstant ? "Publishing..." : "Publish Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: START GROW INITIATIVE ── */}
      {isCreateGrowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar bg-white dark:bg-[#111815] rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-950 p-4 sm:p-6 space-y-4 relative">
            <button
              onClick={() => setIsCreateGrowOpen(false)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-500" />
              <span>Start a Grow Cause</span>
            </h3>
            <form onSubmit={handleCreateGrow} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cause Title *
                </label>
                <input
                  type="text"
                  value={growTitle}
                  onChange={(e) => setGrowTitle(e.target.value)}
                  placeholder="e.g. Versova Beach Ocean Clean & Plastic Recovery"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cause Category
                  </label>
                  <select
                    value={growCause}
                    onChange={(e) => setGrowCause(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="CLEAN_OCEAN">Clean Oceans & Beaches</option>
                    <option value="NATURE">Nature & Trail Care</option>
                    <option value="PLANTATION">Tree Plantation Drive</option>
                    <option value="HUMANITY">Humanity & Food Drive</option>
                    <option value="ANIMAL_WELFARE">Animal Rescue & Shelter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Volunteers Needed
                  </label>
                  <input
                    type="number"
                    value={growVolunteers}
                    onChange={(e) => setGrowVolunteers(e.target.value)}
                    placeholder="15"
                    min="2"
                    max="100"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Meeting Location *
                  </label>
                  <input
                    type="text"
                    value={growLocation}
                    onChange={(e) => setGrowLocation(e.target.value)}
                    placeholder="e.g. Juhu Beach Pillar 4"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={growDate}
                    onChange={(e) => setGrowDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Plan *
                </label>
                <textarea
                  value={growDesc}
                  onChange={(e) => setGrowDesc(e.target.value)}
                  placeholder="Explain what the initiative aims to accomplish and what volunteers should bring..."
                  required
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateGrowOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGrow}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md transition disabled:opacity-50"
                >
                  {submittingGrow ? "Starting..." : "Publish Initiative"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: HIDE TREASURE ── */}
      {isCreateTreasureOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar bg-white dark:bg-[#111815] rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-950 p-4 sm:p-6 space-y-4 relative">
            <button
              onClick={() => setIsCreateTreasureOpen(false)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Gem className="w-5 h-5 text-amber-500" />
              <span>Hide a Treasure Drop</span>
            </h3>
            <form onSubmit={handleCreateTreasure} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Treasure Title *
                </label>
                <input
                  type="text"
                  value={treasureTitle}
                  onChange={(e) => setTreasureTitle(e.target.value)}
                  placeholder="e.g. The Whispering Banyan of Golconda"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hint Riddle *
                </label>
                <textarea
                  value={treasureRiddle}
                  onChange={(e) => setTreasureRiddle(e.target.value)}
                  placeholder="Write a poetic or clever riddle that hints at this secret landmark..."
                  required
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Spot Name
                  </label>
                  <input
                    type="text"
                    value={treasureLocation}
                    onChange={(e) => setTreasureLocation(e.target.value)}
                    placeholder="e.g. Old Fort Rampart"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={treasureLat}
                    onChange={(e) => setTreasureLat(e.target.value)}
                    placeholder="17.3850"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={treasureLng}
                    onChange={(e) => setTreasureLng(e.target.value)}
                    placeholder="78.4867"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTreasureOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTreasure}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-md transition disabled:opacity-50"
                >
                  {submittingTreasure ? "Hiding..." : "Hide on Map"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: SOLVE TREASURE ── */}
      {solveModalOpen && selectedTreasure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto no-scrollbar bg-white dark:bg-[#111815] rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-950 p-4 sm:p-6 space-y-4 relative">
            <button
              onClick={() => setSolveModalOpen(false)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              <span>Claim Treasure: {selectedTreasure.title}</span>
            </h3>
            <p className="text-xs text-slate-500 italic">
              &ldquo;{selectedTreasure.hintRiddle}&rdquo;
            </p>
            <form onSubmit={handleSolveTreasure} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  What is the answer to this riddle? *
                </label>
                <input
                  type="text"
                  value={solveGuessInput}
                  onChange={(e) => setSolveGuessInput(e.target.value)}
                  placeholder="Enter your discovery answer..."
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {solveFeedback && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 text-xs text-amber-800 dark:text-amber-200 font-medium">
                  {solveFeedback}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSolveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={solvingTreasure || !solveGuessInput.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-md transition disabled:opacity-50"
                >
                  {solvingTreasure ? "Verifying..." : "Submit Discovery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 5: POST FIND ME CLUE ── */}
      {isCreateFindMeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar bg-white dark:bg-[#111815] rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-950 p-4 sm:p-6 space-y-4 relative">
            <button
              onClick={() => setIsCreateFindMeOpen(false)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <span>Drop a Mystery Dating Clue</span>
            </h3>
            <form onSubmit={handleCreateFindMe} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Mystery Clue *
                </label>
                <textarea
                  value={findMeText}
                  onChange={(e) => setFindMeText(e.target.value)}
                  placeholder="e.g. Reading Murakami by the corner table with a matchbook on the saucer..."
                  required
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vicinity / Area *
                  </label>
                  <input
                    type="text"
                    value={findMeArea}
                    onChange={(e) => setFindMeArea(e.target.value)}
                    placeholder="e.g. Bandra West or Indiranagar"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vibe Tag
                  </label>
                  <select
                    value={findMeVibe}
                    onChange={(e) => setFindMeVibe(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Coffee & Books">Coffee & Books</option>
                    <option value="Sunset & Chai">Sunset & Chai</option>
                    <option value="Art & Vinyl">Art & Vinyl</option>
                    <option value="Late Night Drive">Late Night Drive</option>
                    <option value="Rooftop Drinks">Rooftop Drinks</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateFindMeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFindMe}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 shadow-md transition disabled:opacity-50"
                >
                  {submittingFindMe ? "Posting..." : "Drop Clue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 6: GUESS FIND ME ── */}
      {selectedFindMe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto no-scrollbar bg-white dark:bg-[#111815] rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-950 p-4 sm:p-6 space-y-4 relative">
            <button
              onClick={() => setSelectedFindMe(null)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <span>Solve Clue & Connect for a Date</span>
            </h3>
            <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 text-xs text-rose-900 dark:text-rose-200 italic">
              &ldquo;{selectedFindMe.clueText}&rdquo;
            </div>
            <form onSubmit={handleSubmitFindMeGuess} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Where is this spot / what is the answer? *
                </label>
                <input
                  type="text"
                  value={guessAnswerInput}
                  onChange={(e) => setGuessAnswerInput(e.target.value)}
                  placeholder="e.g. Subko Specialty Coffee Roasters"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Intro Note (Optional)
                </label>
                <input
                  type="text"
                  value={guessMessageInput}
                  onChange={(e) => setGuessMessageInput(e.target.value)}
                  placeholder="e.g. I go there every Sunday, would love to grab a coffee!"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {guessFeedback && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-xs text-rose-800 dark:text-rose-200 font-medium">
                  {guessFeedback}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFindMe(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGuess || !guessAnswerInput.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 shadow-md transition disabled:opacity-50"
                >
                  {submittingGuess ? "Sending..." : "Submit Guess & Date"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── AUTH PROMPT MODAL ── */}
      {authPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-center">
          <div className="w-full max-w-sm max-h-[92vh] overflow-y-auto no-scrollbar bg-white dark:bg-[#111815] rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-950 p-5 sm:p-6 space-y-4 relative">
            <button
              onClick={() => setAuthPromptOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-emerald-500 flex items-center justify-center mx-auto text-white shadow-md">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Join Travally Community
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Create a free explorer account to share posts, participate in Grow initiatives, hide treasures, and connect!
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/register"
                className="w-full py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md hover:from-emerald-700 hover:to-teal-700 transition"
              >
                Join Free
              </Link>
              <Link
                href="/login"
                className="w-full py-2.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#18241f] hover:bg-slate-200 transition"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT INSTANT DISPATCH ── */}
      {editingInstant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar bg-white dark:bg-[#111815] rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-950 p-4 sm:p-6 space-y-4 relative">
            <button
              onClick={() => {
                setEditingInstant(null);
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
                  <span>Edit Field Dispatch</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Update your field observation, coordinates, or attached capture
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dispatch Note *
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Update your field observation..."
                  required
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Upload / Replace Photo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Snapshot Photo (Optional)
                </label>
                {editImage ? (
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-emerald-950 bg-slate-900 shadow-inner group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editImage}
                      alt="Dispatch photo preview"
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
                  Location / Trail Tag (Optional)
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

              {editSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingInstant(null);
                    setEditImageError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18241f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit || !editContent.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md transition disabled:opacity-50 active:scale-95"
                >
                  {submittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Dispatch...</span>
                    </>
                  ) : (
                    <span>Save Dispatch</span>
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
