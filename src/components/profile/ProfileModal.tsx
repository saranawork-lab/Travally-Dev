"use client";

import React, { useEffect, useState } from "react";
import { X, MapPin } from "lucide-react";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import { AvatarBadge } from "@/components/common/AvatarBadge";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    profile?: any;
  } | null;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || !user) return null;

  const profile = user.profile || {};
  const displayName = profile.displayName || user.email?.split("@")[0] || "Explorer";
  const avatarUrl = profile.avatarUrl;
  const city = profile.city;
  const bio = profile.bio;
  const interests = profile.interests ? profile.interests.split(",").map((i: string) => i.trim()).filter(Boolean) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#0f1713] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-white transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Background */}
        <div className="h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 dark:from-emerald-800 dark:to-emerald-950 relative" />
        
        {/* Profile Content */}
        <div className="px-6 pb-8 relative -mt-12">
          <div className="flex justify-center mb-3 relative z-10">
            <div className="bg-white dark:bg-[#0f1713] p-1.5 rounded-full shadow-lg">
              <AvatarBadge
                src={avatarUrl}
                name={displayName}
                size="xl"
                showCrown={false}
              />
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              {displayName}
              <VerificationBadge
                status={profile.verificationStatus || "UNVERIFIED"}
                isVerified={profile.isVerified}
                hasLinkedin={!!profile.linkedinUrl}
              />
            </h2>
            {city && (
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {city}
              </p>
            )}
          </div>

          <div className="space-y-5">
            {bio && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">About</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#151f1a] p-4 rounded-2xl border border-slate-100 dark:border-emerald-900/30">
                  {bio}
                </p>
              </div>
            )}
            
            {interests.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">Interests</h3>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {interests.map((interest: string, i: number) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!bio && interests.length === 0 && (
              <div className="text-center text-sm text-slate-500 py-4">
                This user hasn't added a bio or interests yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
