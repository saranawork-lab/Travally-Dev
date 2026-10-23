"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  verificationStatus: string;
  city: string | null;
  mode?: "companion" | "traveler";
  joinRank?: number;
  membershipNumber?: string | null;
}

interface AuthContextType {
  currentUser: SessionUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<SessionUser | null>>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  logout: async () => {},
  refreshUser: async () => {},
  loading: true,
});

export const AuthProvider: React.FC<{
  initialUser?: SessionUser | null;
  children: React.ReactNode;
}> = ({ initialUser = null, children }) => {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(() => {
    if (initialUser !== undefined && initialUser !== null) return initialUser;
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("travally_auth_user");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return initialUser ?? null;
  });
  const [loading, setLoading] = useState(initialUser === undefined && !currentUser);
  const router = useRouter();

  // Keep state in sync with server component's initialUser
  useEffect(() => {
    if (initialUser !== undefined) {
      setCurrentUser(initialUser ?? null);
      if (typeof window !== "undefined") {
        try {
          if (initialUser) localStorage.setItem("travally_auth_user", JSON.stringify(initialUser));
          else localStorage.removeItem("travally_auth_user");
        } catch {}
      }
      setLoading(false);
    }
  }, [initialUser]);

  // Sync state to localStorage whenever currentUser changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (currentUser) {
          localStorage.setItem("travally_auth_user", JSON.stringify(currentUser));
        }
      } catch {}
    }
  }, [currentUser]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (!data?.user) {
          setCurrentUser((prev) => {
            if (prev) {
              // Session was invalidated because user logged in on another device
              if (typeof window !== "undefined") {
                try {
                  localStorage.removeItem("travally_auth_user");
                } catch {}
                window.dispatchEvent(new Event("travally_auth_changed"));
              }
              router.push("/login?reason=session_expired");
            }
            return null;
          });
        } else {
          setCurrentUser(data.user);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("travally_auth_user", JSON.stringify(data.user));
            } catch {}
          }
        }
      } else {
        setCurrentUser((prev) => {
          if (prev) {
            if (typeof window !== "undefined") {
              try {
                localStorage.removeItem("travally_auth_user");
              } catch {}
            }
            router.push("/login?reason=session_expired");
          }
          return null;
        });
      }
    } catch {
      // Intermittent network glitch: preserve state
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout request failed:", e);
    } finally {
      setCurrentUser(null);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("travally_auth_user");
        } catch {}
        window.dispatchEvent(new Event("travally_auth_changed"));
      }
      router.push("/");
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    if (initialUser === undefined) {
      refreshUser();
    }

    const handleAuthEvent = () => {
      refreshUser();
    };

    window.addEventListener("travally_auth_changed", handleAuthEvent);
    return () => {
      window.removeEventListener("travally_auth_changed", handleAuthEvent);
    };
  }, [initialUser, refreshUser]);

  // Periodic Single Active Session Verification (Polls every 6 seconds when logged in)
  useEffect(() => {
    if (!currentUser) return;

    const intervalId = setInterval(() => {
      refreshUser();
    }, 6000);

    const handleFocus = () => {
      refreshUser();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [currentUser, refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        logout,
        refreshUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
