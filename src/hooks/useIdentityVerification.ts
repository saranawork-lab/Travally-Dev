"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { VerificationStatus, MockScenario } from "@/server/verification/types";
import { CreateMode } from "@/components/common/UnifiedCreateFlow";

export function isCategoryProtected(mode: CreateMode): boolean {
  // Post is completely EXEMPT.
  // Activity & Travel, Nature & Humanity, and Treasure & Clue are PROTECTED.
  return mode !== "instant";
}

export function useIdentityVerification() {
  const { currentUser, refreshUser } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean>(Boolean(currentUser?.isVerified));
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    (currentUser?.verificationStatus as VerificationStatus) || "UNVERIFIED"
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [intendedMode, setIntendedMode] = useState<CreateMode | null>(null);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);
  const [verificationMode, setVerificationMode] = useState<"test" | "live">("test");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Sync with auth user
  useEffect(() => {
    if (currentUser) {
      const verified = Boolean(currentUser.isVerified && currentUser.verificationStatus === "VERIFIED");
      setIsVerified(verified);
      setVerificationStatus((currentUser.verificationStatus as VerificationStatus) || (verified ? "VERIFIED" : "UNVERIFIED"));
    }
  }, [currentUser]);

  // Fetch latest authoritative status from backend
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/verification/status");
      if (res.ok) {
        const data = await res.json();
        const verified = Boolean(data.isVerified && data.verificationStatus === "VERIFIED");
        setIsVerified(verified);
        setVerificationStatus(data.verificationStatus || (verified ? "VERIFIED" : "UNVERIFIED"));
        setIsMockMode(Boolean(data.isMockMode));
        if (data.mode) {
          setVerificationMode(data.mode);
        }
        if (data.activeSessionId) {
          setActiveSessionId(data.activeSessionId);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch verification status:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const openVerification = useCallback((targetMode?: CreateMode) => {
    if (targetMode) {
      setIntendedMode(targetMode);
    }
    setIsModalOpen(true);
  }, []);

  const closeVerification = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  /**
   * Evaluates if the requested creation category requires verification.
   * Returns true if access is permitted (either exempt or user is verified).
   * Returns false and triggers verification modal if user is unverified.
   */
  const checkAccess = useCallback(
    (mode: CreateMode): boolean => {
      // 1. Post is always exempt
      if (!isCategoryProtected(mode)) {
        return true;
      }

      // 2. If user is verified, grant instant access
      if (isVerified && verificationStatus === "VERIFIED") {
        return true;
      }

      // 3. User is unverified; open modal and preserve intended mode
      openVerification(mode);
      return false;
    },
    [isVerified, verificationStatus, openVerification]
  );

  const handleVerificationSuccess = useCallback(async () => {
    setIsVerified(true);
    setVerificationStatus("VERIFIED");
    await refreshUser();
    await fetchStatus();
  }, [refreshUser, fetchStatus]);

  const resetVerification = useCallback(async () => {
    try {
      const res = await fetch("/api/verification/reset", { method: "POST" });
      if (res.ok) {
        setIsVerified(false);
        setVerificationStatus("UNVERIFIED");
        setActiveSessionId(null);
        await refreshUser();
        await fetchStatus();
      }
    } catch (e) {
      console.error("Error resetting verification:", e);
    }
  }, [refreshUser, fetchStatus]);

  return {
    isVerified,
    verificationStatus,
    isLoading,
    isModalOpen,
    intendedMode,
    isMockMode,
    verificationMode,
    activeSessionId,
    openVerification,
    closeVerification,
    checkAccess,
    handleVerificationSuccess,
    resetVerification,
    refreshVerification: fetchStatus,
  };
}
