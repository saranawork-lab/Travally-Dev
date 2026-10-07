import React from "react";
import { CheckCircle2, Clock, ShieldCheck, ShieldAlert, Linkedin } from "lucide-react";

interface VerificationBadgeProps {
  status: "VERIFIED" | "PENDING" | "UNVERIFIED" | string;
  isVerified?: boolean;
  hasLinkedin?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  isVerified = false,
  hasLinkedin = false,
  size = "md",
  showLabel = false,
}) => {
  const isActuallyVerified = isVerified || status === "VERIFIED";

  if (isActuallyVerified) {
    return (
      <span
        title="Identity Verified Community Member"
        className={`inline-flex items-center gap-1 font-medium rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/50 ${
          size === "sm" ? "px-1.5 py-0.5 text-xs" : size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
        }`}
      >
        <ShieldCheck className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />
        {showLabel && <span>Verified</span>}
        {hasLinkedin && (
          <span title="LinkedIn Connected" className="ml-0.5 text-[#0A66C2]">
            <Linkedin className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
          </span>
        )}
      </span>
    );
  }

  if (status === "PENDING") {
    return (
      <span
        title="Verification Pending Review"
        className={`inline-flex items-center gap-1 font-medium rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50 ${
          size === "sm" ? "px-1.5 py-0.5 text-xs" : size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
        }`}
      >
        <Clock className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        {showLabel && <span>Verification Pending</span>}
      </span>
    );
  }

  return (
    <span
      title="Identity Not Verified"
      className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/50 ${
        size === "sm" ? "px-1.5 py-0.5 text-xs" : size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
      }`}
    >
      <ShieldAlert className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />
      {showLabel && <span>Unverified</span>}
    </span>
  );
};

