"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  Search,
  RefreshCw,
  Clock,
  Eye,
  AlertCircle,
  ZoomIn,
  FileText,
  User,
  ArrowLeft,
  Calendar,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

interface VerificationItem {
  id: string;
  sessionId: string;
  userId: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "INCOMPLETE";
  documentType: string;
  documentImage: string | null;
  selfieImage: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  user: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    city: string | null;
    country: string;
    isVerified: boolean;
    dbVerificationStatus: string;
    registeredAt: string | null;
  };
}

interface SummaryStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

const DOCUMENT_LABELS: Record<string, string> = {
  PAN_CARD: "PAN Card",
  PASSPORT: "Passport",
  DRIVING_LICENSE: "Driver's License",
  VOTER_ID: "Voter ID",
  NATIONAL_ID: "National ID",
};

const COMMON_REJECTION_REASONS = [
  "Document photo is blurry, unreadable, or low resolution",
  "Live selfie face does not match the photo on the ID card",
  "Document borders or key details (name, photo, DOB) are cropped out",
  "Incorrect document uploaded or unaccepted format",
  "Lighting glare or reflection obscures critical card information",
];

export default function SuperAdminVerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<"PENDING" | "VERIFIED" | "REJECTED" | "ALL">("PENDING");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingItem, setRejectingItem] = useState<VerificationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>(COMMON_REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>("");

  // Lightbox Zoom Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Dropdown state per verification card
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (sessionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedIds(new Set(filteredVerifications.map((v) => v.sessionId)));
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchVerifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/verifications");
      if (res.status === 403) {
        setError("Super Admin access restricted. Please sign in with the Super Admin account (superadmin@travally.app).");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load verification queue.");
      }
      const data = await res.json();
      setVerifications(data.verifications || []);
      setSummary(data.summary || { total: 0, pending: 0, verified: 0, rejected: 0 });
    } catch (err: any) {
      setError(err.message || "Network error loading verifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Handle Approve (Tick mark)
  const handleApprove = async (item: VerificationItem) => {
    setProcessingId(item.sessionId);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: item.sessionId,
          action: "APPROVE",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to approve verification.");
      }

      // Update state locally for instant feedback
      setVerifications((prev) =>
        prev.map((v) =>
          v.sessionId === item.sessionId
            ? {
                ...v,
                status: "VERIFIED",
                reviewedAt: new Date().toISOString(),
                user: { ...v.user, isVerified: true, dbVerificationStatus: "VERIFIED" },
              }
            : v
        )
      );

      setSummary((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        verified: prev.verified + 1,
      }));

      showToast(`Approved and verified ${item.user.displayName}! Database status updated.`);
    } catch (err: any) {
      alert(err.message || "Failed to approve verification.");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    const finalReason = customReason.trim() ? customReason.trim() : rejectionReason;
    setProcessingId(rejectingItem.sessionId);

    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: rejectingItem.sessionId,
          action: "REJECT",
          rejectionReason: finalReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reject verification.");
      }

      // Update state locally
      setVerifications((prev) =>
        prev.map((v) =>
          v.sessionId === rejectingItem.sessionId
            ? {
                ...v,
                status: "REJECTED",
                rejectionReason: finalReason,
                reviewedAt: new Date().toISOString(),
                user: { ...v.user, isVerified: false, dbVerificationStatus: "REJECTED" },
              }
            : v
        )
      );

      setSummary((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        rejected: prev.rejected + 1,
      }));

      showToast(`Rejected verification for ${rejectingItem.user.displayName}. Reason recorded.`);
      setRejectingItem(null);
      setCustomReason("");
    } catch (err: any) {
      alert(err.message || "Failed to reject verification.");
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered List
  const filteredVerifications = useMemo(() => {
    return verifications.filter((item) => {
      // Tab filter
      if (activeTab === "PENDING" && item.status !== "PENDING") return false;
      if (activeTab === "VERIFIED" && item.status !== "VERIFIED") return false;
      if (activeTab === "REJECTED" && item.status !== "REJECTED") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.user.displayName?.toLowerCase().includes(q);
        const emailMatch = item.user.email?.toLowerCase().includes(q);
        const docMatch = (DOCUMENT_LABELS[item.documentType] || item.documentType).toLowerCase().includes(q);
        return nameMatch || emailMatch || docMatch;
      }

      return true;
    });
  }, [verifications, activeTab, searchQuery]);

  if (error) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Super Admin Access Required</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{error}</p>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-left space-y-1.5 text-xs">
            <p className="font-bold text-slate-700 dark:text-slate-300">How to access this dashboard:</p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              1. Log out of normal user account
              <br />
              2. Sign in as: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">superadmin@travally.app</strong>
              <br />
              3. Enter the configured complex Super Admin password
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-950 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#0c120f] py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Top Navigation & Breadcrumbs */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Platform Admin</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500/10 via-emerald-500/10 to-teal-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>SUPER ADMIN PORTAL</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-emerald-950/60 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>Customer Verification Queue</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Manually review submitted government ID documents and live camera selfies. Click the green tick mark to
              authoritatively verify customer accounts in the database.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchVerifications}
            disabled={loading}
            className="self-start sm:self-center px-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#111815] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111815] border border-amber-200/80 dark:border-amber-900/60 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Pending Review</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">{summary.pending}</p>
            <p className="text-[10.5px] text-slate-400 mt-0.5">Awaiting your manual action</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111815] border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Verified</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">{summary.verified}</p>
            <p className="text-[10.5px] text-slate-400 mt-0.5">Full access granted in DB</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111815] border border-rose-200/80 dark:border-rose-900/60 shadow-xs">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Rejected</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">{summary.rejected}</p>
            <p className="text-[10.5px] text-slate-400 mt-0.5">Declined with reasons</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 shadow-xs">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Submissions</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">{summary.total}</p>
            <p className="text-[10.5px] text-slate-400 mt-0.5">Historical verification records</p>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tab Pills */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-200/70 dark:bg-[#141f19] border border-slate-200 dark:border-emerald-950/80">
            <button
              type="button"
              onClick={() => setActiveTab("PENDING")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "PENDING"
                  ? "bg-white dark:bg-[#1c2a23] text-emerald-900 dark:text-emerald-200 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Pending Review</span>
              {summary.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
                  {summary.pending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("VERIFIED")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "VERIFIED"
                  ? "bg-white dark:bg-[#1c2a23] text-emerald-900 dark:text-emerald-200 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Verified ({summary.verified})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("REJECTED")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "REJECTED"
                  ? "bg-white dark:bg-[#1c2a23] text-emerald-900 dark:text-emerald-200 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Rejected ({summary.rejected})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-white dark:bg-[#1c2a23] text-emerald-900 dark:text-emerald-200 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All ({summary.total})
            </button>
          </div>

          {/* Right Controls: Expand / Collapse All & Search Input */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-2 rounded-xl text-[11px] font-bold bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
                title="Expand all verification photo dropdowns"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-2 rounded-xl text-[11px] font-bold bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
                title="Collapse all verification photo dropdowns"
              >
                Collapse All
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customer, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>
        </div>

        {/* Verification Queue Cards */}
        {loading ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Loading verification requests...</p>
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {activeTab === "PENDING" ? "Queue is empty!" : "No verification submissions found"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeTab === "PENDING"
                ? "All customer verification requests have been processed. Great job!"
                : "No customer records matched your selected tab or search query."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredVerifications.map((item) => {
              const docTitle = DOCUMENT_LABELS[item.documentType] || item.documentType;
              const isPending = item.status === "PENDING";
              const isVerified = item.status === "VERIFIED";
              const isRejected = item.status === "REJECTED";
              const isProcessing = processingId === item.sessionId;
              const isExpanded = expandedIds.has(item.sessionId);

              return (
                <div
                  key={item.sessionId}
                  className={`rounded-3xl border transition-all duration-200 bg-white dark:bg-[#111815] shadow-xs overflow-hidden ${
                    isPending
                      ? "border-amber-300/80 dark:border-amber-800/80 ring-1 ring-amber-500/20"
                      : isVerified
                      ? "border-emerald-200 dark:border-emerald-950/80"
                      : "border-rose-200 dark:border-rose-950/80"
                  }`}
                >
                  {/* Card Header: User Info & Status Badges */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-emerald-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#141f19]/40">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center overflow-hidden font-black text-sm shrink-0 border border-slate-200 dark:border-emerald-950">
                        {item.user.avatarUrl ? (
                          <img
                            src={item.user.avatarUrl}
                            alt={item.user.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{item.user.displayName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                            {item.user.displayName}
                          </h3>
                          {item.user.isVerified && (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]" title="Currently verified in DB">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{item.user.email}</span>
                          </span>
                          {item.user.city && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{item.user.city}</span>
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Submitted {new Date(item.submittedAt).toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Document Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-emerald-950 flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-emerald-600" />
                        <span>{docTitle}</span>
                      </span>

                      {isPending && (
                        <span className="px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>Pending Review</span>
                        </span>
                      )}

                      {isVerified && (
                        <span className="px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Verified</span>
                        </span>
                      )}

                      {isRejected && (
                        <span className="px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1.5">
                          <X className="w-3 h-3 stroke-[3]" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Toggle Bar with Short/Medium Icons */}
                  <div className="border-b border-slate-100 dark:border-emerald-950/60 bg-slate-50/70 dark:bg-[#141f19]/60">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.sessionId)}
                      className={`w-full px-4 sm:px-5 py-3 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group ${
                        isExpanded
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                          : "hover:bg-slate-100/80 dark:hover:bg-[#18261e]"
                      }`}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Two Short/Medium Preview Icons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* 1. ID Document Thumbnail */}
                          <div className="relative group/doc">
                            <div className="w-13 h-9 rounded-xl overflow-hidden bg-slate-900 border-2 border-slate-200 dark:border-emerald-900/80 shadow-xs flex items-center justify-center">
                              {item.documentImage ? (
                                <img
                                  src={item.documentImage}
                                  alt={docTitle}
                                  className="w-full h-full object-cover group-hover/doc:scale-110 transition-transform"
                                />
                              ) : (
                                <FileText className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md text-[8px] font-black uppercase tracking-tight bg-emerald-600 text-white shadow-xs">
                              ID
                            </span>
                          </div>

                          {/* 2. Live Selfie Thumbnail */}
                          <div className="relative group/selfie">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-900 border-2 border-slate-200 dark:border-emerald-900/80 shadow-xs flex items-center justify-center">
                              {item.selfieImage ? (
                                <img
                                  src={item.selfieImage}
                                  alt="Live Selfie"
                                  className="w-full h-full object-cover group-hover/selfie:scale-110 transition-transform"
                                />
                              ) : (
                                <User className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md text-[8px] font-black uppercase tracking-tight bg-teal-600 text-white shadow-xs">
                              Face
                            </span>
                          </div>
                        </div>

                        {/* Dropdown description */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {isExpanded ? "Inspection Documents & Live Selfie" : "Click Dropdown to View Images"}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60">
                              2 Photos
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {isExpanded
                              ? "Click to collapse images"
                              : `Preview ${docTitle} and live selfie comparison side-by-side`}
                          </p>
                        </div>
                      </div>

                      {/* Dropdown Chevron Trigger */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hidden sm:inline">
                          {isExpanded ? "Collapse" : "Open Dropdown"}
                        </span>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200 shadow-xs ${
                            isExpanded
                              ? "bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rotate-180"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 group-hover:border-emerald-500 group-hover:text-emerald-600"
                          }`}
                        >
                          <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Dropdown Expanded View: Side-by-Side Images (ID Document & Live Camera Selfie) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 sm:p-5 bg-white dark:bg-[#111815]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {/* 1. Government ID Document */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                <span className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>1. Official {docTitle}</span>
                                </span>
                                {item.documentImage && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewImage({
                                        url: item.documentImage!,
                                        title: `${item.user.displayName}'s ${docTitle}`,
                                        subtitle: `Submitted by ${item.user.email}`,
                                      })
                                    }
                                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                  >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                    <span>Enlarge Image</span>
                                  </button>
                                )}
                              </div>

                              <div
                                onClick={() => {
                                  if (item.documentImage) {
                                    setPreviewImage({
                                      url: item.documentImage,
                                      title: `${item.user.displayName}'s ${docTitle}`,
                                      subtitle: `Submitted by ${item.user.email}`,
                                    });
                                  }
                                }}
                                className={`relative aspect-[1.58/1] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-200 dark:border-emerald-950 flex items-center justify-center group ${
                                  item.documentImage ? "cursor-pointer hover:border-emerald-500 transition-colors" : ""
                                }`}
                              >
                                {item.documentImage ? (
                                  <>
                                    <img
                                      src={item.documentImage}
                                      alt="Submitted Document"
                                      className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 text-xs font-bold backdrop-blur-xs">
                                      <ZoomIn className="w-4 h-4" />
                                      <span>Click to inspect details</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center p-4 text-slate-500 text-xs">
                                    <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                                    <span>No document image recorded</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 2. Live Camera Selfie */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                <span className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>2. Live Camera Selfie</span>
                                </span>
                                {item.selfieImage && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewImage({
                                        url: item.selfieImage!,
                                        title: `${item.user.displayName}'s Live Selfie`,
                                        subtitle: `Face comparison against ${docTitle}`,
                                      })
                                    }
                                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                  >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                    <span>Enlarge Selfie</span>
                                  </button>
                                )}
                              </div>

                              <div
                                onClick={() => {
                                  if (item.selfieImage) {
                                    setPreviewImage({
                                      url: item.selfieImage,
                                      title: `${item.user.displayName}'s Live Selfie`,
                                      subtitle: `Face comparison against ${docTitle}`,
                                    });
                                  }
                                }}
                                className={`relative aspect-[1.58/1] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-200 dark:border-emerald-950 flex items-center justify-center group ${
                                  item.selfieImage ? "cursor-pointer hover:border-emerald-500 transition-colors" : ""
                                }`}
                              >
                                {item.selfieImage ? (
                                  <>
                                    <img
                                      src={item.selfieImage}
                                      alt="Live Selfie"
                                      className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 text-xs font-bold backdrop-blur-xs">
                                      <ZoomIn className="w-4 h-4" />
                                      <span>Click to compare facial match</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center p-4 text-slate-500 text-xs">
                                    <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                                    <span>No live selfie recorded</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Rejection Note (if previously rejected) */}
                          {isRejected && item.rejectionReason && (
                            <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                              <p className="font-bold">Rejection Reason Provided:</p>
                              <p className="text-[11px]">{item.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Card Footer: Action Controls */}
                  <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-emerald-950/60 bg-slate-50/70 dark:bg-[#141f19]/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      <span>User ID: </span>
                      <span className="font-mono">{item.userId}</span>
                      {item.reviewedBy && (
                        <>
                          <span className="mx-1.5">•</span>
                          <span>Reviewed by: {item.reviewedBy}</span>
                        </>
                      )}
                    </div>

                    {/* Manual Approval & Rejection Action Buttons */}
                    <div className="flex items-center gap-2.5 ml-auto">
                      {isPending ? (
                        <>
                          {/* Reject Button */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => {
                              setRejectingItem(item);
                              setRejectionReason(COMMON_REJECTION_REASONS[0]);
                              setCustomReason("");
                            }}
                            className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Reject</span>
                          </button>

                          {/* Green Tick Mark (Approve & Verify) Button */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApprove(item)}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 stroke-[3]" />
                            )}
                            <span>Approve & Verify</span>
                          </button>
                        </>
                      ) : (
                        /* Allow Super Admin to re-verify or re-evaluate */
                        <div className="flex items-center gap-2">
                          {isRejected ? (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApprove(item)}
                              className="px-3.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Re-Approve Customer</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => {
                                setRejectingItem(item);
                                setRejectionReason(COMMON_REJECTION_REASONS[0]);
                                setCustomReason("");
                              }}
                              className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Revoke Verification</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rejection Reason Modal */}
      <AnimatePresence>
        {rejectingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center border border-rose-300 dark:border-rose-900">
                    <X className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Reject Verification: {rejectingItem.user.displayName}
                    </h3>
                    <p className="text-[11px] text-slate-400">Select a clear reason to inform the customer</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Common Reason:
                </label>
                <div className="space-y-1.5">
                  {COMMON_REJECTION_REASONS.map((r, i) => (
                    <label
                      key={i}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        rejectionReason === r && !customReason.trim()
                          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                          : "border-slate-200 dark:border-emerald-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejectionReason"
                        checked={rejectionReason === r && !customReason.trim()}
                        onChange={() => {
                          setRejectionReason(r);
                          setCustomReason("");
                        }}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Or write custom rejection feedback:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please retake photo with less glare on the PAN number..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-emerald-950/60">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-emerald-950 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processingId !== null}
                  onClick={handleConfirmReject}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {processingId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-Screen Image Lightbox Modal */}
      <AnimatePresence>
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between text-white px-2">
                <div>
                  <h4 className="text-sm sm:text-base font-bold">{previewImage.title}</h4>
                  {previewImage.subtitle && (
                    <p className="text-xs text-slate-400">{previewImage.subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative w-full max-h-[80vh] overflow-hidden rounded-2xl bg-slate-950 border border-white/20 shadow-2xl flex items-center justify-center p-2">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl"
                />
              </div>

              <p className="text-[11px] text-slate-400">Press ESC or click anywhere outside to close</p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white border border-emerald-500/50 shadow-2xl flex items-center gap-3 text-xs max-w-md"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
