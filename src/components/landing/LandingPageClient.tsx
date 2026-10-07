"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SemiCircleTestimonials } from "./SemiCircleTestimonials";
import {
  Users,
  Compass,
  ShieldCheck,
  Zap,
  UserPlus,
  ArrowRight,
  MapPin,
  Calendar,
  Star,
  Lock,
  BadgeCheck,
  ChevronRight,
  Film,
  Mountain,
  Clock,
  Clock3,
  Wallet,
  CheckCircle2,
  HeartHandshake,
  Heart,
  Tag,
  Bookmark,
  Menu,
  ChevronDown,
  HelpCircle,
  Coffee,
} from "lucide-react";
import { ConnectSection } from "@/components/common/ConnectSection";


/**
 * 3D Tilt Component with Interactive Mouse Perspective & High-Performance Mobile Mode
 */
function Card3DContainer({
  children,
  accentColor = "emerald",
}: {
  children: React.ReactNode;
  accentColor?: "emerald" | "orange";
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>(
    "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"
  );
  const [glare, setGlare] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only perform 3D tilt calculations on desktop precision pointers (avoids mobile scroll jank)
    if (typeof window !== "undefined" && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setTransform(
      `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
    );
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.3,
    });
  };

  const handleMouseLeave = () => {
    setTransform(
      "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"
    );
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative transition-all duration-300 ease-out transform-gpu cursor-pointer select-none group/3d will-change-transform"
      style={{
        transform,
        transformStyle: "preserve-3d",
      }}
    >
      {/* 3D Ambient Backdrop Glow - Optimized for mobile GPU */}
      <div
        className={`hidden sm:block absolute -inset-4 rounded-3xl blur-2xl opacity-35 group-hover/3d:opacity-65 transition-opacity duration-500 pointer-events-none ${accentColor === "emerald"
          ? "bg-gradient-to-tr from-emerald-500/40 via-teal-500/30 to-emerald-400/20"
          : "bg-gradient-to-tr from-orange-500/40 via-amber-500/30 to-rose-500/20"
          }`}
      />

      {/* Dynamic Lighting Glare Sheen */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl z-40 transition-opacity duration-300 hidden sm:block"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.4) 0%, transparent 65%)`,
          opacity: glare.opacity,
        }}
      />

      {children}
    </div>
  );
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  return { ref, isVisible: true };
}

function LandingPageClient() {
  const [activeHeroBg, setActiveHeroBg] = useState(0);

  const heroDestinations = [
    {
      name: "Friends on a Journey",
      state: "India",
      image:
        "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1920&auto=format&fit=crop&q=85",
      tag: "Social Travel",
      price: "",
      spots: "",
    },
    {
      name: "City Cafe Hangout",
      state: "Urban Explorer",
      image:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&auto=format&fit=crop&q=85",
      tag: "Companion Meetups",
      price: "",
      spots: "",
    },
    {
      name: "Trekking Together",
      state: "Adventure",
      image:
        "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&auto=format&fit=crop&q=85",
      tag: "Group Expeditions",
      price: "",
      spots: "",
    },
    {
      name: "Sunset Companions",
      state: "Coastal",
      image:
        "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=1920&auto=format&fit=crop&q=85",
      tag: "Travel Dating",
      price: "",
      spots: "",
    },
  ];

  // Auto-rotate hero background gently every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroBg((prev) => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(timer);
  }, []);



  const companionReveal = useScrollReveal();
  const travelReveal = useScrollReveal();
  const howItWorksReveal = useScrollReveal();
  const testimonialsReveal = useScrollReveal();
  const faqReveal = useScrollReveal();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const FAQS = [
    {
      q: "Is Travally safe for solo female travelers?",
      a: "Yes, 100%. Safety is foundational to Travally: all members complete Government ID and mobile phone verification. Our Mutual Consent Gatekeeper means no one can ever direct-message you without your explicit approval. Plus, all first companion meetups are required to take place at verified, busy public venues (like indie film theaters, cultural centers, or cafes), and we feature dedicated women-only expedition filters.",
    },
    {
      q: "Can anyone on the platform message me out of the blue?",
      a: "Strictly no. Travally operates with a Mutual Approval Gatekeeper. Chat rooms unlock only when both the organizer and the applicant approve each other. You will never receive cold DMs, marketing messages, or unsolicited contact.",
    },
    {
      q: "How do travel expenses and budget splitting work?",
      a: "Every expedition card states a clear estimated rupee budget range (e.g. ₹8,500 – ₹14,500) covering shared transit, boutique stays, and permits. Travelers split real costs directly between themselves with zero platform markups, hidden cuts, or booking commissions.",
    },
    {
      q: "What happens if someone cancels or doesn't show up?",
      a: "Travally tracks reliability through attendance badges. Hosts can instantly invite waiting list members. Members who fail to show up without prior communication forfeit their verified standing and may be removed from the platform.",
    },
    {
      q: "Is Travally completely free to use?",
      a: "Yes! Travally is 100% free to join, explore city companions, and organize trips. We believe genuine human connection and safe travel should be open to all verified explorers.",
    },
  ];

  const TESTIMONIALS = [
    {
      name: "Harshita S.",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80",
      city: "Delhi NCR",
      role: "Street Photographer",
      activityTitle: "Old Delhi Morning Photowalk",
      rating: 5,
      quote:
        "wanted to do sunrise street photography in chandni chowk but hated going alone at 5am. found two super chill photographers here and got crazy good shots!",
      badge: "Govt ID Verified",
      type: "City Companion",
    },
    {
      name: "Rohan Verma",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80",
      city: "Mumbai",
      role: "Himalayan Backpacker",
      activityTitle: "6-Day Parvati Valley & Tosh Trek",
      rating: 4,
      quote:
        "cab from chandigarh to kasol was 6.5k. matched with 2 guys on here, split the fare 3 ways and shared a homestay in tosh. saved money and made great trek buddies.",
      badge: "Govt ID Verified",
      type: "Travel Expedition",
    },
    {
      name: "Meghana Rao",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
      city: "Bengaluru",
      role: "Cinema & Coffee",
      activityTitle: "Suchitra Film Society & Filter Coffee",
      rating: 5,
      quote:
        "matched with two girls for a sunday indie film at suchitra. grabbed filter coffee after and debated the ending for 2 hours straight. zero awkwardness!",
      badge: "Superhost",
      type: "City Companion",
    },
    {
      name: "Siddharth J.",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80",
      city: "Pune",
      role: "Weekend Trekker",
      activityTitle: "Harishchandragad Cliff Camping",
      rating: 4,
      quote:
        "was nervous about cliff camping with strangers at harishchandragad, but vibes were unmatched. split tent gear & food equally, no drama at all.",
      badge: "Govt ID Verified",
      type: "Travel Expedition",
    },
    {
      name: "Pooja Nambiar",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80",
      city: "Chennai",
      role: "Solo Backpacker",
      activityTitle: "Rameshwaram & Dhanushkodi Trail",
      rating: 5,
      quote:
        "parents were worried about me visiting dhanushkodi solo. found meera here with the exact same dates—shared a beachside room and felt 100% safe.",
      badge: "Govt ID Verified",
      type: "Travel Expedition",
    },
    {
      name: "Sourav Banerjee",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80",
      city: "Kolkata",
      role: "Heritage Walks",
      activityTitle: "North Kolkata Heritage Walk",
      rating: 5,
      quote:
        "new to kolkata and had nobody to explore north kolkata with. connected with a local guy who knew all the historic sweet shops and hidden lanes.",
      badge: "Superhost",
      type: "City Companion",
    },
    {
      name: "Kavya Reddy",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80",
      city: "Hyderabad",
      role: "Board Game Host",
      activityTitle: "Jubilee Hills Weekend Board Games",
      rating: 4,
      quote:
        "remote work in hyd made meeting people hard. hosted a 3-person catan table at roast cafe on saturday—chill crowd and we still meet up regularly!",
      badge: "Govt ID Verified",
      type: "City Companion",
    },
    {
      name: "Aditya Sharma",
      avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=160&auto=format&fit=crop&q=80",
      city: "Bengaluru",
      role: "Remote Workation",
      activityTitle: "South Goa Workation & Surf Camp",
      rating: 5,
      quote:
        "workation in south goa was 10/10. met 3 remote devs on travally—worked afternoons with fast wifi and hit the beach for sunset surf every evening.",
      badge: "Nomad Leader",
      type: "Travel Expedition",
    },
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#090d0b] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans overflow-x-clip">
      {/* Limited Seats Popup Notification Every Time User Enters Landing Page */}
      {/* Limited Seats Popup Notification Removed */}


      {/* Background Gradient Meshes for Lower Sections */}
      <div className="hidden sm:block absolute top-1/3 right-4 w-[34rem] h-[34rem] bg-gradient-to-bl from-orange-500/20 via-amber-500/15 to-rose-500/10 rounded-full blur-[110px] pointer-events-none transform-gpu" />
      <div className="hidden sm:block absolute top-2/3 left-4 w-[36rem] h-[36rem] bg-gradient-to-tr from-emerald-500/18 via-teal-500/14 to-emerald-400/10 rounded-full blur-[120px] pointer-events-none transform-gpu" />

      {/* ── 1. HERO SECTION WITH CINEMATIC DYNAMIC TRAVEL BACKGROUND ── */}
      <section className="relative w-full overflow-clip touch-pan-y bg-slate-950 text-white min-h-[100svh] min-h-[100dvh] min-h-screen pt-20 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 shadow-2xl flex flex-col justify-center items-center">
        {/* Dynamic Background Image Layers with Smooth Crossfade */}
        {heroDestinations.map((dest, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none ${activeHeroBg === idx
              ? "[clip-path:circle(150%_at_50%_50%)] opacity-100 z-10 scale-100"
              : "[clip-path:circle(0%_at_50%_50%)] opacity-0 z-0 scale-105"
              }`}
          >
            <img
              src={dest.image}
              alt={dest.name}
              className="w-full h-full object-cover object-center"
            />
          </div>
        ))}

        {/* Deep cinematic gradient overlay: from dark to medium to dark */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/65 to-slate-950/90 pointer-events-none z-20" />

        {/* Atmospheric ambient lighting glow */}
        <div className="hidden sm:block absolute -top-24 left-1/4 w-[36rem] h-[36rem] bg-emerald-500/18 rounded-full blur-[140px] pointer-events-none transform-gpu z-20" />
        <div className="hidden sm:block absolute -bottom-24 right-1/4 w-[32rem] h-[32rem] bg-amber-500/14 rounded-full blur-[140px] pointer-events-none transform-gpu z-20" />

        <div className="relative z-30 text-center max-w-4xl mx-auto space-y-4 sm:space-y-6">

          {/* Main Headline with Premium Editorial Hierarchy and generous line spacing on mobile */}
          <h1 className="animate-fade-in-up animation-delay-200 text-5xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight max-w-4xl mx-auto drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] pb-1">
            <span className="block sm:mb-2">Meet good people.</span>
            <span className="block font-light italic text-emerald-200 sm:mb-2">Share real journeys.</span>
            <span className="inline-block pb-2 sm:pb-3.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              Never miss an outing again.
            </span>
          </h1>

          {/* Natural, Human-Centric Subtitle */}
          <p className="animate-fade-in-up animation-delay-300 text-sm sm:text-base text-emerald-50/90 w-[92%] sm:max-w-2xl mx-auto leading-relaxed font-normal mt-4 sm:mt-6 drop-shadow-md">
            Connect with a trusted network of verified travelers and local explorers. We match people who share your vibe and budget, ensuring every journey is safe and authentic.
          </p>

          {/* High-Converting Primary CTA */}
          <div className="animate-fade-in-up animation-delay-400 flex items-center justify-center mt-6 sm:mt-8 mb-2">
            <Link
              href="/register"
              className="group w-[85%] sm:w-auto max-w-sm mx-auto min-h-[56px] px-10 rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 hover:from-orange-300 hover:to-amber-300 text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 shadow-[0_12px_40px_rgba(251,146,60,0.4)] hover:shadow-[0_16px_48px_rgba(251,146,60,0.6)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <Users className="w-5 h-5" />
              <span>Join Travally Free</span>
              <ArrowRight className="w-5 h-5 ml-0.5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>
          </div>

          {/* Social Proof & Trust Glass Panel */}
          <div className="animate-fade-in-up animation-delay-500 pt-6 sm:pt-8 flex flex-col items-center justify-center gap-6 animate-float-soft">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 px-6 sm:px-8 py-4 sm:py-3.5 rounded-3xl sm:rounded-full bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-[90%] sm:w-auto mx-auto max-w-sm sm:max-w-none">
              {/* Verified Members */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-extrabold text-white text-xs tracking-wide">Social Companions</span>
                  <span className="text-emerald-400 text-[10px] font-medium tracking-wide uppercase">Local &amp; Trip Meetups</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full sm:w-px h-px sm:h-8 bg-white/20" />

              {/* Trust & Safety Metric */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-extrabold text-white text-xs tracking-wide">Mutual Approval</span>
                  <span className="text-amber-400 text-[10px] font-medium tracking-wide uppercase">Zero Spam Promise</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. SECTION 1: COMPANION CARD SECTION (CARD ON LEFT, TEXT ON RIGHT) ── */}
      <section
        id="companion"
        ref={companionReveal.ref}
        className={`scroll-mt-28 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-emerald-950/70 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] transform-gpu relative ${companionReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* LEFT COLUMN: Discover-style Companion Card Preview */}
          <div className="lg:col-span-5 w-full max-w-sm mx-auto lg:max-w-none">
            <Card3DContainer accentColor="emerald">
              <div className="group relative w-full bg-white dark:bg-[#101915] rounded-3xl border border-emerald-100 dark:border-emerald-950/70 shadow-[0_20px_50px_rgba(16,185,129,0.12)] hover:shadow-[0_25px_60px_rgba(16,185,129,0.22)] transition-all duration-500 flex flex-col overflow-hidden">
                {/* ── TOP THUMBNAIL BANNER (High clarity, zero muddy fog!) ── */}
                <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=900&auto=format&fit=crop&q=80"
                    alt="Suchitra Film Society Screening & Filter Coffee"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.92]"
                  />
                  {/* Clean gradient overlays for legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30 pointer-events-none" />

                  {/* Top Floating Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-emerald-300 border border-white/15 shadow-sm tracking-wide">
                      <Film className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Movies &amp; Cinema</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 border border-emerald-400/40 sm:animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white sm:animate-ping" />
                        <span>1 spot left</span>
                      </span>
                    </div>
                  </div>

                  {/* Bottom Image Overlay Badges: Quick Location & Time */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-center justify-between text-xs text-white/95">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-semibold truncate max-w-[190px] sm:max-w-none">Indiranagar, Bengaluru</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 shadow-sm">
                      <Calendar className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                      <span className="font-semibold">Sat, Oct 1 • 5 PM</span>
                    </div>
                  </div>
                </div>

                {/* ── CARD CONTENT BODY ── */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-3.5">
                    {/* Activity Title */}
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        Suchitra Film Society Screening &amp; Filter Coffee
                      </h3>
                    </div>

                    {/* Host Profile & Trust Bar (High-Trust Design) */}
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80"
                            alt="Ananya Sharma"
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/40 shadow-sm"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-[#101915]">
                            <BadgeCheck className="w-3 h-3" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                              Ananya Sharma
                            </span>

                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="flex items-center gap-0.5 font-bold text-amber-500">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              4.9
                            </span>
                            <span>•</span>
                            <span>14 Hosted</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Superhost</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:flex flex-col items-end shrink-0 text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Response</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">&lt; 15 mins</span>
                      </div>
                    </div>

                    {/* Host's Warm Invitation Note */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16221c] border border-slate-200/60 dark:border-emerald-950/60">
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                        &ldquo;Catching the new indie film at Suchitra, followed by traditional filter coffee and a passionate conversation about cinema.&rdquo;
                      </p>
                    </div>

                    {/* Key Details Bento: 2 Column Specs */}
                    <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#16221c] border border-slate-200/70 dark:border-emerald-950/60 flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Venue</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Suchitra Cinema</p>
                          <p className="text-[10px] text-slate-500 truncate">Indiranagar, BLR</p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#16221c] border border-slate-200/70 dark:border-emerald-950/60 flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Clock3 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duration</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">3 Hours Total</p>
                          <p className="text-[10px] text-slate-500">Film + Coffee</p>
                        </div>
                      </div>
                    </div>

                    {/* Live Attendee Social Proof & Progress */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            <img
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#101915] object-cover"
                              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                              alt="Ananya"
                            />
                            <div className="inline-flex h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#101915] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold items-center justify-center border border-dashed border-emerald-500">
                              +1
                            </div>
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 text-xs">
                            <strong className="text-slate-900 dark:text-white">1 of 2</strong> spots filled
                          </span>
                        </div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                          1 Open Spot
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-emerald-950/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 transition-all duration-500 shadow-xs"
                          style={{ width: "50%" }}
                        />
                      </div>
                    </div>

                    {/* Trust & Safety Reassurance Micro-Ribbon */}
                    <div className="flex items-center justify-between py-1 px-1 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-emerald-950/60">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Public Cafe &amp; Cinema
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Escrow Safe Meetup
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Lock className="w-3 h-3 text-emerald-500" /> Host-Approved Only
                      </span>
                    </div>
                  </div>

                  {/* ── CARD FOOTER / ACTION BAR ── */}
                  <div className="pt-2 border-t border-slate-100 dark:border-emerald-950/60 flex items-center gap-2.5">
                    <button
                      type="button"
                      className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#16221c] border border-slate-200/80 dark:border-emerald-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-950/80 transition-colors shadow-xs"
                      title="Bookmark Activity"
                    >
                      <Bookmark className="w-4 h-4 mb-0.5" />
                      <span className="text-[9px] font-bold">Save</span>
                    </button>

                    <button
                      type="button"
                      className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-between px-5 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/45 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-emerald-200" />
                        <span>Join Activity</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs text-white flex items-center justify-center">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </Card3DContainer>
          </div>


          {/* RIGHT COLUMN: Narrative & Details of "What All It Shows" */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-md shadow-emerald-600/30 uppercase tracking-wider">
              <Film className="w-3.5 h-3.5" />
              <span>COMPANION MODE • CITY ACTIVITIES</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug text-slate-900 dark:text-white pb-1">
              Discover verified partners for{" "}
              <span className="inline-block pb-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-200 bg-clip-text text-transparent">
                movies, cafes, and everyday urban outings.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Companion Mode gives you a structured, reassuring interface for discovering weekend activities happening in your city. Every detail is established up front:
            </p>

            {/* Feature Breakdown — Accent Bar List */}
            <div className="space-y-4 pt-1">
              <div className="flex items-start gap-3.5 pl-4 border-l-2 border-emerald-500 hover:border-emerald-400 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Verified Host Identity</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                    Know exactly who you join with confirmed Govt ID and verified profile badges.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pl-4 border-l-2 border-emerald-500 hover:border-emerald-400 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Public Meeting Venues</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                    All meetups happen in vibrant, well-lit cafes, galleries, and city hotspots.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pl-4 border-l-2 border-emerald-500 hover:border-emerald-400 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Strict Spots Left Pill</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                    Intimate groups of 2–3 companions only—no awkward crowds or chaotic meetups.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pl-4 border-l-2 border-emerald-500 hover:border-emerald-400 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Mutual Approval Chat Gate</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                    Chat unlocks only when both members accept. Zero spam or cold DMs.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Link */}
            <div className="pt-2">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/35 hover:shadow-emerald-600/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Join Free to Meet Companions</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SECTION 2: TRAVEL CARD SECTION (VICE VERSA! TEXT ON LEFT, CARD ON RIGHT) ── */}
      <section
        id="travel"
        ref={travelReveal.ref}
        className={`scroll-mt-28 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-emerald-950/70 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] transform-gpu relative ${travelReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* LEFT COLUMN: Narrative & Details of "What All It Shows" (Alternating!) */}
          <div className="lg:col-span-7 space-y-5 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white text-xs font-black shadow-md shadow-orange-500/30 uppercase tracking-wider">
              <Mountain className="w-3.5 h-3.5" />
              <span>TRAVEL EXPEDITIONS • TRAVEL DATING & DATES</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug text-slate-900 dark:text-white pb-1">
              Multi-day trips &amp; travel dating with people who match your{" "}
              <span className="inline-block pb-1 bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 dark:from-orange-400 dark:via-amber-300 dark:to-rose-200 bg-clip-text text-transparent">
                travel dates, vibe, and rupee budget.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Solo travel in India is thrilling, but sharing cabs, homestays, or finding a romantic travel date makes the journey significantly safer and more exciting. The Travel Card highlights synchronized travel dates and travel dating vibes up front:
            </p>

            {/* Feature Breakdown — Accent Bar List */}
            <div className="space-y-4 pt-1">
              <div className="flex items-start gap-3.5 pl-4 border-l-2 border-orange-500 hover:border-orange-400 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Transparent Rupee Budget</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                    Clear upfront cost ranges for stays and cabs—zero awkward money talks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pl-4 border-l-2 border-rose-500 hover:border-rose-400 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Travel Dating &amp; Synced Dates</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                    Match with verified singles for scenic dates, or find companions on your exact travel days.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pl-4 border-l-2 border-orange-500 hover:border-orange-400 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Planned Route &amp; Attractions</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                    Daily route highlights, stays, and trails mapped out before you pack your bags.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pl-4 border-l-2 border-orange-500 hover:border-orange-400 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Ephemeral 7-Day Chat Expiry</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                    Group chats auto-delete 7 days post-trip for complete peace of mind and privacy.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Link */}
            <div className="pt-2">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-500 text-white font-extrabold text-sm shadow-xl shadow-orange-500/35 hover:shadow-orange-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Join Free to Match Travel Dates</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Discover-style Travel Card Preview */}
          <div className="lg:col-span-5 w-full max-w-sm mx-auto lg:max-w-none order-1 lg:order-2">
            <Card3DContainer accentColor="orange">
              <div className="group relative w-full bg-white dark:bg-[#121815] rounded-3xl border border-orange-100 dark:border-orange-950/70 shadow-[0_20px_50px_rgba(249,115,22,0.12)] hover:shadow-[0_25px_60px_rgba(249,115,22,0.22)] transition-all duration-500 flex flex-col justify-between overflow-hidden">
                {/* ── TOP THUMBNAIL BANNER ── */}
                <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80"
                    alt="Kasol &amp; Tosh: Parvati Valley Trek"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.92]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30 pointer-events-none" />

                  {/* Floating Badges on Top */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-orange-300 border border-white/15 shadow-sm tracking-wide uppercase">
                      <Compass className="w-3.5 h-3.5 text-orange-400" />
                      <span>Himalayan Trekking</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-rose-500/90 text-white backdrop-blur-md border border-rose-400/40 shadow-sm">
                        <Heart className="w-3 h-3 fill-white text-white" />
                        <span>Travel Dating</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/40 border border-orange-400/40 sm:animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white sm:animate-ping" />
                        <span>1 spot left</span>
                      </span>
                    </div>
                  </div>

                  {/* Bottom Image Overlay: Departure & Match */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-center justify-between text-xs text-white/95">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className="font-semibold">From: Bengaluru / Delhi</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/90 text-white text-[11px] font-black shadow-sm">
                      <span>⚡ 94% MATCH</span>
                    </div>
                  </div>
                </div>

                {/* ── CARD CONTENT BODY ── */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-3.5">
                    {/* Destination Title */}
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug tracking-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        Kasol &amp; Tosh: Parvati Valley Trek
                      </h3>
                    </div>

                    {/* Host row with real photo & trust info */}
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80"
                            alt="Priya Iyer"
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-500/40 shadow-sm"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-[#121815]">
                            <BadgeCheck className="w-3 h-3" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                              Priya Iyer
                            </span>

                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="flex items-center gap-0.5 font-bold text-amber-500">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              4.95
                            </span>
                            <span>•</span>
                            <span>8 Trips Led</span>
                            <span>•</span>
                            <span className="text-orange-600 dark:text-orange-400 font-semibold">Trek Leader</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:flex flex-col items-end shrink-0 text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Pace</span>
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Moderate</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed italic">
                      &ldquo;A 6-day immersive Himalayan trek covering Parvati Valley, Chalal trail, and hot springs of Manikaran. Open to travel dates &amp; compatible travel companions.&rdquo;
                    </p>

                    {/* Key Trip Info Grid */}
                    <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                      {/* Dates & Duration */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#18221c] border border-slate-200/70 dark:border-emerald-950/60 flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Travel Dates</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Oct 12 - Oct 18</p>
                          <p className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold flex items-center gap-1">
                            <Heart className="w-2.5 h-2.5 fill-rose-500" />
                            <span>Travel Dates Synced</span>
                          </p>
                        </div>
                      </div>

                      {/* Budget Range */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#18221c] border border-slate-200/70 dark:border-emerald-950/60 flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Wallet className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Budget Est.</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">₹8,500 - ₹14,500</p>
                          <p className="text-[10px] text-slate-500">Per traveler</p>
                        </div>
                      </div>
                    </div>

                    {/* Group Capacity Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            <img
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#121815] object-cover"
                              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
                              alt="Priya"
                            />
                            <img
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#121815] object-cover"
                              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
                              alt="Rohan"
                            />
                            <div className="inline-flex h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#121815] bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-[10px] font-bold items-center justify-center border border-dashed border-orange-500">
                              +1
                            </div>
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 text-xs">
                            <strong className="text-slate-900 dark:text-white">2 of 3</strong> joined
                          </span>
                        </div>
                        <span className="text-orange-600 dark:text-orange-400 font-extrabold text-xs">
                          1 Spot Open
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-emerald-950/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 transition-all duration-300 shadow-xs"
                          style={{ width: "66%" }}
                        />
                      </div>
                    </div>

                    {/* Planned Attractions Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/60 flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5 fill-rose-500" />
                        Travel Dating Ready
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-[#18241f] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-emerald-950/60">
                        📍 Parvati Valley
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-[#18241f] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-emerald-950/60">
                        🌲 Chalal Trail
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-[#18241f] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-emerald-950/60">
                        ♨️ Manikaran Springs
                      </span>
                    </div>
                  </div>

                  {/* CARD FOOTER / ACTION BAR */}
                  <div className="pt-2 border-t border-slate-100 dark:border-emerald-950/60 flex items-center gap-2.5">
                    <button
                      type="button"
                      className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#18221c] border border-slate-200/80 dark:border-emerald-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-950/80 transition-colors shadow-xs"
                      title="Bookmark Expedition"
                    >
                      <Bookmark className="w-4 h-4 mb-0.5" />
                      <span className="text-[9px] font-bold">Save</span>
                    </button>

                    <button
                      type="button"
                      className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-500 text-white font-extrabold text-sm flex items-center justify-between px-5 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/45 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-orange-200" />
                        <span>Join Expedition</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs text-white flex items-center justify-center">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </Card3DContainer>
          </div>
        </div>
      </section>

      {/* ── 4. ROADMAP: 3 SAFE STEPS ── */}
      <section
        ref={howItWorksReveal.ref}
        className={`py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-emerald-950/60 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] transform-gpu ${howItWorksReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
      >
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-400/40">
            <Zap className="w-3.5 h-3.5 text-orange-500" />
            <span>HOW IT WORKS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            From Solo Idea to Shared Journey in 3 Steps
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            A respectful, zero-pressure process designed around mutual comfort and safety.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Connecting line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/60 via-orange-500/60 to-teal-500/60 md:-translate-x-px" />

          {/* Step 1 */}
          <div className="animate-reveal-bottom relative flex flex-row items-start md:items-center gap-4 md:gap-8 mb-14 group">
            {/* Left content (desktop) */}
            <div className="hidden md:flex md:w-[calc(50%-2rem)] justify-end">
              <div className="text-right space-y-2 max-w-xs">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Sign Up &amp; Verify
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Create your profile with verification credentials. Browse weekend city hangouts or multi-day travel expeditions once you log into the platform.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Quick &amp; Secure
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
            {/* Node */}
            <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-600/40 ring-4 ring-white dark:ring-[#0a0f0d] group-hover:scale-110 transition-transform duration-300">
              1
            </div>
            {/* Right content (mobile + desktop spacer) */}
            <div className="md:w-[calc(50%-2rem)]">
              <div className="md:hidden space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Sign Up &amp; Verify
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Create your profile with verification credentials. Browse weekend city hangouts or multi-day travel expeditions once you log into the platform.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Quick &amp; Secure
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="animate-reveal-bottom animation-delay-200 relative flex flex-row items-start md:items-center gap-4 md:gap-8 mb-14 group">
            {/* Left spacer (desktop) */}
            <div className="hidden md:block md:w-[calc(50%-2rem)]" />
            {/* Node */}
            <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-orange-500/40 ring-4 ring-white dark:ring-[#0a0f0d] group-hover:scale-110 transition-transform duration-300">
              2
            </div>
            {/* Right content */}
            <div className="md:w-[calc(50%-2rem)]">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Mutual Compatibility Check
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Review verified member badges, bio notes, and compatibility scores. Send a personalized join request. No unsolicited messages ever reach your inbox.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400">
                  Zero Unwanted DMs
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="animate-reveal-bottom animation-delay-400 relative flex flex-row items-start md:items-center gap-4 md:gap-8 group">
            {/* Left content (desktop) */}
            <div className="hidden md:flex md:w-[calc(50%-2rem)] justify-end">
              <div className="text-right space-y-2 max-w-xs">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Encrypted Chat &amp; Public Meetup
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  When the host confirms, an end-to-end encrypted room opens. Confirm details, meet in welcoming public spots, and turn solo plans into memorable days.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Safe Public Spaces
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
            {/* Node */}
            <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-700 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-teal-600/40 ring-4 ring-white dark:ring-[#0a0f0d] group-hover:scale-110 transition-transform duration-300">
              3
            </div>
            {/* Right content (mobile) */}
            <div className="md:w-[calc(50%-2rem)]">
              <div className="md:hidden space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Encrypted Chat &amp; Public Meetup
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  When the host confirms, an end-to-end encrypted room opens. Confirm details, meet in welcoming public spots, and turn solo plans into memorable days.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Safe Public Spaces
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── 6. VERIFIED COMMUNITY TESTIMONIALS ── */}
      <section
        ref={testimonialsReveal.ref}
        className={`py-14 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] transform-gpu ${testimonialsReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
      >
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            COMMUNITY STORIES
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Real Encounters, Genuine Connections
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Stories from verified travelers who turned solo weekends into trusted, lifelong friendships.
          </p>
        </div>

        {/* Single-Line Smooth Conveyor */}
        <SemiCircleTestimonials testimonials={TESTIMONIALS} />
      </section>



      {/* ── 8. CONNECT WITH US (EMAILJS) ── */}
      <ConnectSection />

      {/* ── 9. FREQUENTLY ASKED QUESTIONS (ACCORDION) ── */}
      <section
        id="faq"
        ref={faqReveal.ref}
        className={`scroll-mt-28 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto border-t border-slate-200/80 dark:border-emerald-950/70 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] transform-gpu relative ${faqReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
      >
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-emerald-950/60 text-slate-700 dark:text-emerald-300 text-xs font-black border border-slate-200 dark:border-emerald-800/60 uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>TRANSPARENCY FIRST</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Everything you need to know about safety, verification, cost splitting, and companionship.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl transition-all duration-300 border overflow-hidden ${isOpen
                    ? "bg-white dark:bg-[#111915] border-emerald-500/60 dark:border-emerald-600/60 shadow-lg shadow-emerald-500/10 scale-[1.01]"
                    : "bg-slate-50/80 dark:bg-[#111915]/60 border-slate-200/80 dark:border-emerald-950/70 hover:border-slate-300 dark:hover:border-emerald-900"
                  }`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  type="button"
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className={`text-sm sm:text-base font-extrabold transition-colors duration-300 ${isOpen ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 rotate-180"
                        : "bg-slate-200/70 dark:bg-emerald-950/60 text-slate-500 dark:text-slate-400 rotate-0"
                      }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 sm:px-5 pb-5 pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-emerald-950/60">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default LandingPageClient;
