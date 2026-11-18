"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Phone, AlertOctagon, Loader2 } from "lucide-react";

interface MissedCheckInBannerProps {
  session: any;
  onConfirmSafe: () => Promise<void>;
  onTriggerSOS: () => Promise<void>;
}

export const MissedCheckInBanner: React.FC<MissedCheckInBannerProps> = ({
  session,
  onConfirmSafe,
  onTriggerSOS,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session || (!session.isCheckInEscalated && !session.missedCheckInAt)) {
    return null;
  }

  const missedTime = session.nextCheckInAt
    ? new Date(session.nextCheckInAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "scheduled";

  const handleSafeClick = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmSafe();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-amber-500/10 dark:bg-amber-950/40 border-2 border-amber-500/70 p-4 sm:p-5 text-left space-y-3.5 shadow-lg shadow-amber-950/10 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-bounce">
          <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm sm:text-base font-extrabold text-amber-950 dark:text-amber-100">
            We haven&apos;t heard from you.
          </h4>
          <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed mt-0.5">
            You missed your scheduled <strong>{missedTime}</strong> safety check-in. Your emergency contact (<strong>{session.contactName}</strong>) has been alerted with your last recorded location.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        {/* I'm okay - notify contact */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSafeClick}
          className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          <span>I&apos;m okay — notify contact</span>
        </button>

        {/* Call Emergency Contact */}
        <a
          href={`tel:${session.contactPhone}`}
          className="py-3 px-3 rounded-xl bg-slate-100 dark:bg-dark-elevated hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs border border-slate-200 dark:border-dark-border transition flex items-center justify-center gap-1.5"
        >
          <Phone className="w-3.5 h-3.5 text-slate-500" />
          <span>Call Contact</span>
        </a>

        {/* I need help - SOS */}
        <button
          type="button"
          onClick={onTriggerSOS}
          className="py-3 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>I need help — SOS</span>
        </button>
      </div>
    </div>
  );
};

