"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/common/Logo";
import { Mail, ArrowRight, Loader2, KeyRound, CheckCircle2, Sparkles } from "lucide-react";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { PasswordInput } from "@/components/auth/PasswordInput";

const DEMO_ACCOUNTS = [
  {
    id: "ananya",
    name: "Ananya Sharma",
    email: "ananya@travally.app",
    role: "Bengaluru · Coffee & Film",
    city: "Bengaluru",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "rohan",
    name: "Rohan Verma",
    email: "rohan@travally.app",
    role: "Mumbai · Architecture & Treks",
    city: "Mumbai",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "priya",
    name: "Priya Iyer",
    email: "priya@travally.app",
    role: "Delhi · Himalayan Trails",
    city: "New Delhi",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggingInDemo, setLoggingInDemo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    const urlError = searchParams?.get("error");
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
    const reason = searchParams?.get("reason");
    if (reason === "session_expired") {
      setError("Logged out: Your account was logged in on another browser or device.");
    }
  }, [searchParams]);

  // Authenticate user with given credentials
  const performLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please check credentials.");
      }

      // Hard redirect to ensure browser reloads session cookies cleanly
      const targetUrl = data?.redirectUrl || (data?.user?.role === "ADMIN" ? "/admin" : "/discover");
      window.location.href = targetUrl;
    } catch (err: any) {
      setError(err.message || "Failed to log in");
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (acc: typeof DEMO_ACCOUNTS[number]) => {
    setEmail(acc.email);
    setPassword("Password123!");
    setLoggingInDemo(acc.id);
    await performLogin(acc.email, "Password123!");
    setLoggingInDemo(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  return (
    <div className="flex items-center justify-center w-full min-h-[calc(100vh-8rem)] px-3 sm:px-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/60 p-6 sm:p-8 shadow-2xl space-y-5">
        {/* Brand header */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center select-none pointer-events-none">
            <Logo size={32} />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back to Travally
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
            Sign in to access your companion activities, trips, and private chats
          </p>
        </div>

        {/* 1-Click Demo Accounts */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Demo Accounts</span>
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
              Instant Access
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = loggingInDemo === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc)}
                  disabled={loading}
                  className="p-2.5 rounded-2xl text-left border border-slate-200 dark:border-emerald-950/80 bg-slate-50/80 dark:bg-[#16201b] hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-[#1c2a22] transition-all relative flex flex-col items-center text-center group cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-xs mb-1.5 shrink-0">
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform"
                    />
                  </div>
                  <strong className="block text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-full">
                    {acc.name.split(" ")[0]}
                  </strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full">
                    {acc.city}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">
                    @{acc.id}
                  </span>

                  {isSelected && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/80 rounded-2xl flex items-center justify-center backdrop-blur-xs">
                      <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-center text-slate-400">
            Password: <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">Password123!</span>
          </p>
        </div>

        <div className="relative flex py-0.5 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-emerald-950/60" />
          <span className="flex-shrink mx-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Or sign in with email
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-emerald-950/60" />
        </div>

        {/* LinkedIn & Google Social Sign In */}
        <SocialAuthButtons
          mode="login"
          defaultEmail={email}
        />

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 animate-slide-up">
            {error}
          </div>
        )}

        {/* Success notification */}
        {successNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-slide-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Standard Email/Phone + Password Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address or Phone Number
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com or 9876543210"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-emerald-950/70 bg-white dark:bg-[#16201b] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <PasswordInput
              id="login-password"
              label=""
              placeholder="••••••••••••"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In to Travally</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-emerald-950/60">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full min-h-[calc(100vh-8rem)]">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
