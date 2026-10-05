"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/common/Logo";
import {
  Mail,
  User,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Phone,
  ChevronDown,
  Home,
  CheckCircle2,
  HeartHandshake,
  Compass,
  Cigarette,
  Wine,
  Utensils,
} from "lucide-react";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { BirthDatePicker } from "@/components/auth/BirthDatePicker";
import { GenderSelect } from "@/components/auth/GenderSelect";
import { evaluatePassword, getPasswordErrorMessage } from "@/lib/passwordValidation";
import { NotificationPopup } from "@/components/common/NotificationPopup";

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

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [detectedState, setDetectedState] = useState("");
  const [isFetchingPostal, setIsFetchingPostal] = useState(false);
  const [postalDetected, setPostalDetected] = useState(false);
  const lastAutoAreaRef = React.useRef("");
  const [birthDate, setBirthDate] = useState("1998-06-15");
  const [gender, setGender] = useState("PREFER_NOT_TO_SAY");
  const [bio, setBio] = useState("");

  // Lifestyle & Habits
  const [smokingHabit, setSmokingHabit] = useState("");
  const [drinkingHabit, setDrinkingHabit] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState("");
  const [selectedLifestyleTags, setSelectedLifestyleTags] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState(false);

  // Email format validation
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isEmailValid = React.useMemo(() => {
    return EMAIL_REGEX.test(email.trim());
  }, [email]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Strict email validation
    if (!email || !isEmailValid) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      setLoading(false);
      return;
    }

    // 2. Phone number validation
    const cleanPhoneDigits = phoneNumber.replace(/[^0-9]/g, "");
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 10) {
      setError("Please enter a valid 10-digit mobile phone number.");
      setLoading(false);
      return;
    }

    // 3. Password strength validation: min 8, 1 Cap, 1 small, 1 number, 1 special char
    const passwordCheck = evaluatePassword(password);
    if (!passwordCheck.isValid) {
      setError(
        getPasswordErrorMessage(passwordCheck) ||
          "Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
      );
      setLoading(false);
      return;
    }

    // 4. Mandatory Pincode validation (must be 6 digits)
    const cleanPincode = pincode.replace(/[^0-9]/g, "");
    if (!cleanPincode || cleanPincode.length !== 6) {
      setError("Pincode is mandatory. Please enter a valid 6-digit PIN code.");
      setLoading(false);
      return;
    }

    const formattedPhone = `${countryCode} ${cleanPhoneDigits.slice(-10)}`;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          displayName,
          phoneNumber: formattedPhone,
          address,
          region: detectedState || undefined,
          city,
          pincode: cleanPincode,
          birthDate,
          gender,
          bio,
          interests: selectedInterests,
          preferredActivities: selectedInterests,
          smokingHabit,
          drinkingHabit,
          dietaryPreference,
          lifestyleTags: selectedLifestyleTags,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccessNotification(true);
      setTimeout(() => {
        window.location.href = "/discover?registered=true";
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An error occurred during account creation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-[calc(100vh-8rem)] px-3 sm:px-4 py-8 relative">
      <NotificationPopup
        show={successNotification}
        type="success"
        message="Your account has been created successfully! Welcome to Travally."
        onClose={() => setSuccessNotification(false)}
      />
      <div className="w-full max-w-lg bg-white dark:bg-[#111815] rounded-3xl border border-slate-200 dark:border-emerald-950/70 p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="text-center space-y-1.5">
          <div className="flex justify-center select-none pointer-events-none">
            <Logo size={32} />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Create Your Travally Account
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
            Join the trusted platform for everyday activities and travel companions
          </p>
        </div>

        {/* LinkedIn & Google Social Sign Up */}
        <SocialAuthButtons
          mode="signup"
          defaultEmail={email}
          defaultName={displayName}
        />

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Display Name and Phone Number side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-emerald-950/70 bg-white dark:bg-[#16201b] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
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

          {/* Row 2: Email Address in place of Phone Number with Real-time Validity Check */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              {email && !isEmailValid && (
                <span className="text-[10.5px] font-semibold text-rose-500">
                  Please enter a valid email
                </span>
              )}
              {email && isEmailValid && (
                <span className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Valid email
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border ${
                  email && !isEmailValid
                    ? "border-rose-400 dark:border-rose-700 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 dark:border-emerald-950/70 focus:ring-emerald-500/25 focus:border-emerald-500"
                } bg-white dark:bg-[#16201b] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition`}
              />
            </div>
          </div>

          {/* Password with View Option & Real-Time Criteria Checklist */}
          <PasswordInput
            id="register-password"
            label="Password"
            placeholder="••••••••••••"
            value={password}
            onChange={setPassword}
            showCriteria={true}
            autoComplete="new-password"
          />

          {/* Date of Birth & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Date of Birth
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Gender
              </label>
              <GenderSelect
                value={gender}
                onChange={setGender}
              />
            </div>
          </div>

          {/* Pincode (Mandatory) & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                City
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

          {/* Address (House / Flat / Street / Area) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Address
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

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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

          {/* Section: Lifestyle & Habits (For Match Compatibility) */}
          <div className="space-y-3.5 pt-3 border-t border-slate-100 dark:border-emerald-950/60">
            <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Lifestyle & Habits (For Match Compatibility)</span>
            </h2>

            {/* Smoking Preference */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Cigarette className="w-3.5 h-3.5 text-slate-400" />
                <span>Smoking Preference</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SMOKING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSmokingHabit(opt.id)}
                    className={`py-2 px-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-center ${
                      smokingHabit === opt.id
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500"
                        : "bg-white dark:bg-[#16201b] border-slate-200 dark:border-emerald-950/70 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-[9.5px] text-slate-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Drinking Preference */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Wine className="w-3.5 h-3.5 text-slate-400" />
                <span>Drinking Preference</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DRINKING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDrinkingHabit(opt.id)}
                    className={`py-2 px-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-center ${
                      drinkingHabit === opt.id
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500"
                        : "bg-white dark:bg-[#16201b] border-slate-200 dark:border-emerald-950/70 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-[9.5px] text-slate-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Food / Dietary Preference */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-slate-400" />
                <span>Food / Dietary Preference</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DIETARY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDietaryPreference(opt.id)}
                    className={`py-2 px-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-center ${
                      dietaryPreference === opt.id
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500"
                        : "bg-white dark:bg-[#16201b] border-slate-200 dark:border-emerald-950/70 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-[9.5px] text-slate-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lifestyle Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Lifestyle Tags (Select All That Apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {LIFESTYLE_TAGS.map((tag) => {
                  const isSelected = selectedLifestyleTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleLifestyleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/70 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section: Travel & Activity Interests Tags */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-emerald-950/60">
            <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Travel & Activity Interests (Select Tags)</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/70 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>



          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 text-[11px] text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              By joining, you agree to our Community Guidelines and acknowledge that Travally is a free social companion platform.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
