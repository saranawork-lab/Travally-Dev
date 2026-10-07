"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BirthDatePicker } from "@/components/auth/BirthDatePicker";
import { GenderSelect } from "@/components/auth/GenderSelect";
import { NotificationPopup } from "@/components/common/NotificationPopup";
import {
  MapPin,
  User,
  Zap,
  ArrowRight,
  Loader2,
  Calendar,
  Phone,
  Home,
  Cigarette,
  Wine,
  Utensils,
  CheckCircle2,
  HeartHandshake,
  Compass,
  Camera,
  Upload,
  Trash2,
  ShieldCheck,
  Mail,
  Lock,
  KeyRound,
} from "lucide-react";

const TRAVEL_INTERESTS = [
  "☕ Coffee & Cafe Walks",
  "🎬 Cinema & Movie Host",
  "🏔️ Mountain Treks",
  "🚗 Weekend Road Trips",
  "📸 Travel Photography",
  "🏛️ Heritage & Architecture",
  "🏖️ Beach & Islands",
  "🏕️ Camping & Star Gazing",
  "🍲 Street Food Trails",
  "🎒 Solo Backpacking",
];

const SMOKING_OPTIONS = [
  { id: "NON_SMOKER", label: "🚭 Non-Smoker", desc: "Smoke-free" },
  { id: "OCCASIONAL", label: "🚬 Occasional", desc: "Socially only" },
  { id: "REGULAR", label: "💨 Regular", desc: "Regular smoker" },
];

const DRINKING_OPTIONS = [
  { id: "NON_DRINKER", label: "🧃 Non-Drinker", desc: "Teetotaler" },
  { id: "SOCIAL", label: "🥂 Social Drinker", desc: "Events & parties" },
  { id: "REGULAR", label: "🍷 Regular Drinker", desc: "Casual drinks" },
];

const DIETARY_OPTIONS = [
  { id: "PURE_VEG", label: "🥗 Pure Veg", desc: "Vegetarian" },
  { id: "EGGETARIAN", label: "🍳 Eggetarian", desc: "Veg + Eggs" },
  { id: "NON_VEG", label: "🍗 Non-Vegetarian", desc: "All foods" },
  { id: "VEGAN", label: "🥑 Vegan", desc: "Plant-based" },
];

const LIFESTYLE_TAGS = [
  "🌅 Early Riser",
  "🌙 Night Owl",
  "🐾 Pet Friendly",
  "🎧 Music Lover",
  "🏃 Fitness Freak",
  "📸 Photographer",
  "🚗 Long Drives",
  "📚 Reader / Calm",
];

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGoogle = searchParams.get("google") === "true";
  const isLinkedin = searchParams.get("linkedin") === "true";

  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("/default-avatar.png");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [detectedState, setDetectedState] = useState("");
  const [isFetchingPostal, setIsFetchingPostal] = useState(false);
  const [postalDetected, setPostalDetected] = useState(false);
  const lastAutoAreaRef = useRef("");

  const [gender, setGender] = useState("MALE");
  const [birthDate, setBirthDate] = useState("1998-06-15");

  // Lifestyle & Habits
  const [smokingHabit, setSmokingHabit] = useState("");
  const [drinkingHabit, setDrinkingHabit] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState("");
  const [selectedLifestyleTags, setSelectedLifestyleTags] = useState<string[]>([]);

  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Live calculated age from birthDate
  const calculatedAge = React.useMemo(() => {
    if (!birthDate || !birthDate.includes("-")) return null;
    const parts = birthDate.split("-");
    if (parts.length < 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const birth = new Date(y, m, d);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [birthDate]);

  // Auto-fetch city and address area based on pincode
  const handlePincodeChange = async (val: string) => {
    const digits = val.replace(/[^0-9]/g, "").slice(0, 6);
    setPincode(digits);

    if (digits.length === 6) {
      setIsFetchingPostal(true);
      try {
        const res = await fetch(`/api/pincode/${digits}`);
        const data = await res.json();
        if (data.success) {
          if (data.city) setCity(data.city);
          if (data.state) setDetectedState(data.state);
          if (data.area && (!address.trim() || address === lastAutoAreaRef.current)) {
            setAddress(data.area);
            lastAutoAreaRef.current = data.area;
          }
          setPostalDetected(true);
        } else {
          setPostalDetected(false);
        }
      } catch (err) {
        console.warn("Pincode lookup error:", err);
      } finally {
        setIsFetchingPostal(false);
      }
    } else {
      setPostalDetected(false);
    }
  };

  // Fetch current user from profile API
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          const u = data.user;
          setCurrentUser(u);
          setEmail(u.email || "");
          const p = u.profile || {};
          setDisplayName(p.displayName || u.displayName || "");

          if (p.avatarUrl) {
            setAvatarUrl(p.avatarUrl);
          } else if (u.avatarUrl) {
            setAvatarUrl(u.avatarUrl);
          }

          if (p.city) setCity(p.city);
          if (p.pincode) setPincode(p.pincode);
          if (p.address) setAddress(p.address);

          if (p.gender) {
            setGender(p.gender);
          }

          if (p.birthDate) {
            try {
              setBirthDate(new Date(p.birthDate).toISOString().split("T")[0]);
            } catch {}
          }
          if (p.bio) setBio(p.bio);

          let prefs: any = {};
          try {
            prefs = typeof p.connectionPreferences === "string" 
              ? JSON.parse(p.connectionPreferences) 
              : (p.connectionPreferences || {});
          } catch {}

          if (!p.address && prefs.address) setAddress(prefs.address);
          if (!p.pincode && prefs.pincode) setPincode(prefs.pincode);

          if (prefs.phoneNumber) {
            const rawPhone = String(prefs.phoneNumber);
            if (rawPhone.startsWith("+91")) {
              setCountryCode("+91");
              setPhoneNumber(rawPhone.replace("+91", "").trim());
            } else {
              setPhoneNumber(rawPhone);
            }
          }
          if (prefs.smokingHabit) setSmokingHabit(prefs.smokingHabit);
          if (prefs.drinkingHabit) setDrinkingHabit(prefs.drinkingHabit);
          if (prefs.dietaryPreference) setDietaryPreference(prefs.dietaryPreference);
          if (Array.isArray(prefs.lifestyleTags)) setSelectedLifestyleTags(prefs.lifestyleTags);

          try {
            const parsedInterests = JSON.parse(p.interests || "[]");
            if (Array.isArray(parsedInterests) && parsedInterests.length > 0) {
              setSelectedInterests(parsedInterests);
            }
          } catch {}
        } else {
          router.push("/login");
        }
      })
      .catch((err) => {
        console.error("Failed to load user:", err);
        router.push("/login");
      })
      .finally(() => setLoadingUser(false));
  }, [router]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleLifestyleTag = (tag: string) => {
    setSelectedLifestyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // 0. Email validation
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      setSaving(false);
      return;
    }

    // 0.1 Password validation
    if (!password) {
      setError("Please create a password for your account to enable direct email login.");
      setSaving(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setSaving(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-type your password.");
      setSaving(false);
      return;
    }

    // 1. Full name validation
    if (!displayName.trim()) {
      setError("Please enter your display name.");
      setSaving(false);
      return;
    }

    // 2. Phone number validation (mandatory 10 digits)
    const cleanPhoneDigits = phoneNumber.replace(/[^0-9]/g, "");
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 10) {
      setError("Please enter a valid 10-digit mobile phone number.");
      setSaving(false);
      return;
    }

    // 3. Date of birth validation
    if (!birthDate) {
      setError("Please select your date of birth.");
      setSaving(false);
      return;
    }

    // 4. Mandatory Pincode validation (6 digits)
    const cleanPincode = pincode.replace(/[^0-9]/g, "");
    if (!cleanPincode || cleanPincode.length !== 6) {
      setError("Pincode is mandatory. Please enter a valid 6-digit PIN code.");
      setSaving(false);
      return;
    }

    // 5. City and Address validation
    if (!city.trim()) {
      setError("City is required. Please verify your PIN code or enter your city.");
      setSaving(false);
      return;
    }

    if (!address.trim()) {
      setError("Please enter your house / street address.");
      setSaving(false);
      return;
    }

    const formattedPhone = `${countryCode} ${cleanPhoneDigits.slice(-10)}`;

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          avatarUrl: avatarUrl || "/default-avatar.png",
          city: city.trim(),
          address: address.trim(),
          region: detectedState || undefined,
          pincode: cleanPincode,
          gender,
          birthDate: birthDate || null,
          phoneNumber: formattedPhone,
          smokingHabit,
          drinkingHabit,
          dietaryPreference,
          lifestyleTags: selectedLifestyleTags,
          bio: bio.trim(),
          interests: selectedInterests,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccessNotification(true);
      setTimeout(() => {
        window.location.href = "/discover?registered=true";
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving your details");
      setSaving(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-[#070b09] z-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-sm font-semibold text-slate-500">Loading your profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] dark:bg-[#070b09] flex flex-col antialiased relative">
      <NotificationPopup
        show={successNotification}
        type="success"
        message="Your profile has been completed successfully! Welcome to Travally."
        onClose={() => setSuccessNotification(false)}
      />
      {/* Standalone Full-Screen Header */}
      <header className="w-full bg-white/80 dark:bg-[#0c1410]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-emerald-950/60 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={34} />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>VIP Onboarding</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Full-Screen Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Almost Done • Complete Your Profile</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome, {displayName.split(" ")[0] || "Explorer"}!
          </h1>
          <p className="text-sm text-slate-600 dark:text-gray-400 max-w-lg mx-auto">
            {isGoogle ? "Signed in with Google! " : ""}Let&apos;s personalize your companion matching preferences to get the most out of Travally.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#111613] rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-slate-200/80 dark:border-emerald-950/60">
          
          {/* User Preview Mini-Strip */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#151e18] border border-slate-200/80 dark:border-emerald-950/60 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm shrink-0">
              <img
                src={avatarUrl || "/default-avatar.png"}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                  {displayName || currentUser?.email}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Account
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-gray-400 truncate block">
                {currentUser?.email}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- SECTION 1: PROFILE PHOTO & PERSONAL DETAILS --- */}
            <div className="space-y-4">
              <h2 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                <span>1. Profile Photo & Personal Details</span>
              </h2>

              {/* Profile Image Uploader */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-3xl bg-slate-50 dark:bg-[#151e18] border border-slate-200/80 dark:border-emerald-950/60">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md ring-4 ring-emerald-500/10 bg-slate-200 dark:bg-slate-800">
                    <img
                      src={avatarUrl || "/default-avatar.png"}
                      alt="Profile Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                      }}
                    />
                  </div>
                  <label
                    htmlFor="avatar-upload-input"
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer transition-transform hover:scale-110"
                    title="Change profile photo"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      id="avatar-upload-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                  </label>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Profile Photo
                    </h3>
                    {avatarUrl && avatarUrl !== "/default-avatar.png" ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        Photo Selected
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        Default Avatar
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload a clear photo or use your Google picture.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1.5">
                    <label
                      htmlFor="avatar-upload-input"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </label>
                    {avatarUrl && avatarUrl !== "/default-avatar.png" && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl("/default-avatar.png")}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors px-2 py-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Use Default</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 0: Email & Password for Direct Login */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Login Credentials & Account Email</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Confirm your email and set a password so you can also log in directly using email & password.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Account Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-950/70 bg-white dark:bg-[#16201b] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Create Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-950/70 bg-white dark:bg-[#16201b] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type password"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-950/70 bg-white dark:bg-[#16201b] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 1: Full Name & Phone Number side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Display Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-emerald-950/70 bg-white dark:bg-[#16201b] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Phone Number *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-emerald-950/80 pr-2 select-none">
                      +91
                    </span>
                    <input
                      required
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      className="w-full pl-14 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-emerald-950/70 bg-white dark:bg-[#16201b] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Date of Birth & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Date of Birth *
                    </label>
                    {calculatedAge !== null && (
                      <span className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {calculatedAge} yrs old
                      </span>
                    )}
                  </div>
                  <BirthDatePicker
                    value={birthDate}
                    onChange={setBirthDate}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Gender *
                  </label>
                  <GenderSelect
                    value={gender}
                    onChange={setGender}
                  />
                </div>
              </div>

              {/* Row 3: Pincode (Mandatory) & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Pincode <span className="text-rose-500">*</span>
                    </label>
                    {postalDetected && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Auto-detected
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="6-digit PIN code"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-emerald-950/70 bg-white dark:bg-[#16201b] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition"
                    />
                    {isFetchingPostal && (
                      <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600 animate-spin" />
                    )}
                    {!isFetchingPostal && postalDetected && (
                      <CheckCircle2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    City *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-emerald-950/70 bg-white dark:bg-[#16201b] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Address (House / Flat / Street / Area) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Address *
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Flat no., Street, Area"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-emerald-950/70 bg-white dark:bg-[#16201b] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Row 5: Short Bio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Short Bio (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="What are your favorite weekend activities, cinema tastes, or travel bucket list items?"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-emerald-950/70 bg-white dark:bg-[#16201b] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* --- SECTION 2: LIFESTYLE & HABITS (SMOKER, DRINKER, DIET) --- */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-emerald-950/60">
              <h2 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>2. Lifestyle & Habits (For Match Compatibility)</span>
              </h2>

              {/* Smoking Habit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Cigarette className="w-3.5 h-3.5 text-slate-400" />
                  <span>Smoking Preference</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SMOKING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSmokingHabit(opt.id)}
                      className={`py-2 px-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-center ${
                        smokingHabit === opt.id
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500"
                          : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drinking Habit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Wine className="w-3.5 h-3.5 text-slate-400" />
                  <span>Drinking Preference</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DRINKING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDrinkingHabit(opt.id)}
                      className={`py-2 px-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-center ${
                        drinkingHabit === opt.id
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500"
                          : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-slate-400" />
                  <span>Food / Dietary Preference</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DIETARY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDietaryPreference(opt.id)}
                      className={`py-2 px-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-center ${
                        dietaryPreference === opt.id
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500"
                          : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personality & Vibe Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Travel Style & Personality Tags</span>
                  <span className="text-[10px] text-slate-400 font-normal">Select matching traits</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LIFESTYLE_TAGS.map((tag) => {
                    const isSelected = selectedLifestyleTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleLifestyleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* --- SECTION 3: TRAVEL PASSIONS --- */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-emerald-950/60">
              <h2 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Compass className="w-3.5 h-3.5" />
                <span>3. Travel Passions & Activities</span>
              </h2>

              <div>
                <div className="flex flex-wrap gap-2">
                  {TRAVEL_INTERESTS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                            : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Short Bio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  About Yourself (Short Bio)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Passionate traveler looking for coffee walks, city explorations, and weekend getaways..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activating Profile...</span>
                </>
              ) : (
                <>
                  <span>Save Profile & Open VIP Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xs">
          Loading onboarding...
        </div>
      }
    >
      <OnboardingForm />
    </Suspense>
  );
}

