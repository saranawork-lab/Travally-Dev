"use client";

import React, { useState, useEffect } from "react";
import { Lock, Copy, CheckCircle, X } from "lucide-react";
import { getConversationFingerprint } from "@/lib/crypto";

interface E2EESecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  conversationTitle?: string;
}

export const E2EESecurityModal: React.FC<E2EESecurityModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  conversationTitle,
}) => {
  const [fingerprint, setFingerprint] = useState<string>("Loading fingerprint...");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && conversationId) {
      getConversationFingerprint(conversationId).then(setFingerprint);
    }
  }, [isOpen, conversationId]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-slide-up relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Shield Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
            <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              End-to-End Encryption
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              AES-GCM 256-bit Verified
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Messages sent in <strong className="text-slate-900 dark:text-white">{conversationTitle || "this chat"}</strong> are end-to-end encrypted. They are locked before leaving your device and can only be decrypted by approved members in this room.
        </p>

        {/* Safety Number / Fingerprint Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
              Safety Verification Number
            </span>
            <button
              onClick={handleCopy}
              className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:underline flex items-center gap-1"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="font-mono text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 tracking-wider text-center py-2 bg-white dark:bg-[#0c1410] rounded-xl border border-slate-200/60 dark:border-emerald-950/60">
            {fingerprint}
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-tight">
            Compare this number with other participants to confirm that your encryption keys match without interception.
          </p>
        </div>

        {/* Technical Specs List */}
        <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-emerald-950/60 pt-3">
          <div className="flex justify-between">
            <span>Cipher Protocol</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">AES-GCM (256 bits)</span>
          </div>
          <div className="flex justify-between">
            <span>Key Derivation</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">PBKDF2-HMAC-SHA256 (100k)</span>
          </div>
          <div className="flex justify-between">
            <span>Server Decryption</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">Zero (Zero-Knowledge)</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm"
        >
          Close &amp; Return to Chat
        </button>
      </div>
    </div>
  );
};
