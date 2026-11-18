"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Flag,
  ArrowLeft,
  UserCheck,
  RefreshCw,
  Mail,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

export default function AdminModerationPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports");
      if (res.status === 403) {
        setError("Admin access denied. Please log in with an administrator account (e.g. admin@travally.app).");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (reportId: string, status: "RESOLVED" | "DISMISSED", actionTaken: string) => {
    setProcessingId(reportId);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reportId, status, actionTaken }),
      });
      if (res.ok) {
        fetchReports();
      } else {
        alert("Failed to update report status");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 px-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
        <p className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
          Tip: In demo mode, use the floating Persona Switcher at the bottom-right and select &quot;Admin Moderator&quot;.
        </p>
        <Link href="/" className="inline-flex px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 transition shadow-sm">
          Return to Home
        </Link>
      </div>
    );
  }

  const pendingReports = reports.filter((r) => r.status === "PENDING");
  const reviewedReports = reports.filter((r) => r.status !== "PENDING");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 mb-1 border border-rose-200 dark:border-rose-900/50">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Platform Trust & Safety Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Moderation Queue
          </h1>
          <p className="text-xs text-slate-500">
            Review user-submitted reports for community violations, commercial solicitation, and safety issues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/verifications"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>ID Verification Queue</span>
          </Link>
          <button
            onClick={fetchReports}
            className="p-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-dark-elevated text-xs flex items-center gap-1 text-slate-600 dark:text-slate-300 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading moderation queue...</div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Pending Queue */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>Pending Action</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold">
                {pendingReports.length}
              </span>
            </h2>

            {pendingReports.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border text-xs text-slate-400">
                <CheckCircle className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                <span>The moderation queue is completely clear! All reports reviewed.</span>
              </div>
            ) : (
              pendingReports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        {rep.targetType} REPORT
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Reason: {rep.reason.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Reported {formatTimeAgo(rep.createdAt)} by {rep.reporter?.profile?.displayName || rep.reporter?.email}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-dark-elevated p-3 rounded-2xl border border-slate-200/60 dark:border-dark-border leading-relaxed">
                    <strong>Reported Target ID:</strong> {rep.targetId}
                    {rep.details && (
                      <span className="block mt-1">
                        <strong>Reporter Notes:</strong> &ldquo;{rep.details}&rdquo;
                      </span>
                    )}
                  </p>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        handleAction(rep.id, "DISMISSED", "Dismissed after moderator review - no policy breach found.")
                      }
                      disabled={processingId === rep.id}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-elevated transition border border-slate-200 dark:border-dark-border"
                    >
                      Dismiss Report
                    </button>
                    <button
                      onClick={() =>
                        handleAction(rep.id, "RESOLVED", "Action taken: Target user warned / content flagged.")
                      }
                      disabled={processingId === rep.id}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm"
                    >
                      Resolve & Enforce Policy
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Section 2: History */}
          {reviewedReports.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Resolved & Dismissed History ({reviewedReports.length})
              </h2>

              <div className="space-y-3">
                {reviewedReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rep.status === "RESOLVED" ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300" : "bg-slate-200 dark:bg-dark-elevated text-slate-700 dark:text-slate-300"
                        }`}>
                          {rep.status}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {rep.targetType}: {rep.reason.replace(/_/g, " ")}
                        </span>
                      </div>
                      {rep.actionTaken && (
                        <p className="text-[11px] text-slate-500 mt-1">{rep.actionTaken}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatTimeAgo(rep.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
