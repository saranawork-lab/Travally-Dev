"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface DatabaseHealthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showIndicator?: boolean;
}

let cachedDbConnected: boolean | null = null;
let lastHealthCheck = 0;

export const DatabaseHealthGuard: React.FC<DatabaseHealthGuardProps> = ({
  children,
  fallback,
  showIndicator = false,
}) => {
  const [dbState, setDbState] = useState<{
    checked: boolean;
    connected: boolean;
    latencyMs?: number;
    provider?: string;
    error?: string;
  }>({
    checked: cachedDbConnected !== null,
    connected: cachedDbConnected ?? true,
  });
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    if (cachedDbConnected === true && Date.now() - lastHealthCheck < 60000) {
      return;
    }
    setChecking(true);
    try {
      const res = await fetch("/api/health/db");
      if (res.ok) {
        const data = await res.json();
        cachedDbConnected = data.ok ?? true;
        lastHealthCheck = Date.now();
        setDbState({
          checked: true,
          connected: data.ok ?? true,
          latencyMs: data.latencyMs,
          provider: data.provider,
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        cachedDbConnected = false;
        setDbState({
          checked: true,
          connected: false,
          error: errData.error || "Database is currently unreachable",
        });
      }
    } catch (e: any) {
      cachedDbConnected = false;
      setDbState({
        checked: true,
        connected: false,
        error: e.message || "Failed to reach database health check endpoint",
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // If connection is verified and stable, render children
  if (dbState.connected) {
    return (
      <>
        {showIndicator && dbState.checked && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 w-fit mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Database Connected ({dbState.latencyMs}ms)</span>
          </div>
        )}
        {children}
      </>
    );
  }

  // Fallback UI when database connection is down
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-8 max-w-xl mx-auto my-8 bg-white dark:bg-[#131c18] border border-orange-200 dark:border-orange-900/60 rounded-3xl shadow-xl text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Database Connection Issue
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
          {dbState.error ||
            "Unable to establish a stable database connection. Please check your database server configuration."}
        </p>
      </div>

      <button
        onClick={checkHealth}
        disabled={checking}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition shadow-sm"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
        <span>{checking ? "Checking Connection..." : "Retry Connection"}</span>
      </button>
    </div>
  );
};

