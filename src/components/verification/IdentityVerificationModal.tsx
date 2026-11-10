"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  FileText,
  Lock,
  ArrowRight,
  Eye,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";
import { DocumentType, MockScenario, VerificationStatus } from "@/server/verification/types";
import { CreateMode } from "@/components/common/UnifiedCreateFlow";

export interface IdentityVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (targetMode?: CreateMode) => void;
  intendedMode?: CreateMode | null;
  isMockMode?: boolean;
  verificationMode?: "test" | "live";
}

type VerificationStep = "consent" | "document" | "selfie" | "processing" | "result";

const DOCUMENT_OPTIONS: { id: DocumentType; label: string; description: string }[] = [
  { id: "PASSPORT", label: "Passport", description: "All official national passports" },
  { id: "DRIVING_LICENSE", label: "Driver's License", description: "Government issued driving card" },
  { id: "PAN_CARD", label: "PAN Card", description: "Income Tax Department photo card" },
  { id: "VOTER_ID", label: "Voter ID", description: "Election Commission photo identity card" },
  { id: "NATIONAL_ID", label: "National ID", description: "Government issued photo identification" },
];

export const IdentityVerificationModal: React.FC<IdentityVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  intendedMode,
  isMockMode = true,
  verificationMode = "test",
}) => {
  const [activeMode, setActiveMode] = useState<"test" | "live">(verificationMode);

  useEffect(() => {
    if (verificationMode) {
      setActiveMode(verificationMode);
    }
  }, [verificationMode]);

  const [step, setStep] = useState<VerificationStep>("consent");
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [documentType, setDocumentType] = useState<DocumentType>("PASSPORT");
  const [documentFile, setDocumentFile] = useState<{
    file: File | null;
    previewUrl: string | null;
    base64: string | null;
  }>({ file: null, previewUrl: null, base64: null });
  const [docError, setDocError] = useState<string | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selfieCaptured, setSelfieCaptured] = useState<{
    previewUrl: string | null;
    base64: string | null;
  }>({ previewUrl: null, base64: null });

  // Verification processing & result
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(10);
  const [processingStageText, setProcessingStageText] = useState<string>("Analyzing document authenticity...");
  const [verificationResult, setVerificationResult] = useState<{
    status: VerificationStatus;
    errorMessage?: string;
    confidenceScore?: number;
  }>({ status: "NOT_STARTED" });

  // Neetix verification state

  // Video & Canvas references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("consent");
      setHasConsented(false);
      setDocError(null);
      setCameraError(null);
      setDocumentFile({ file: null, previewUrl: null, base64: null });
      setSelfieCaptured({ previewUrl: null, base64: null });
      setVerificationResult({ status: "NOT_STARTED" });
      setProcessingProgress(10);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser. Please use a modern browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access error:", err);
      let msg = "Could not access camera. Please allow camera permissions in your browser.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera access in your address bar and retry.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No front camera found on this device.";
      }
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  // Capture frame from video stream onto hidden canvas
  const handleCaptureSelfie = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror image for natural selfie orientation
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setSelfieCaptured({
      previewUrl: dataUrl,
      base64: dataUrl,
    });
    stopCamera();
  };

  const handleRetakeSelfie = () => {
    setSelfieCaptured({ previewUrl: null, base64: null });
    startCamera();
  };

  // Handle document file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setDocError("Document file must be smaller than 5MB");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setDocError("Please upload a JPEG, PNG, or WebP image");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setDocumentFile({
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
      });
    };
    reader.readAsDataURL(file);
  };

  // Step transitions
  const handleStartVerification = async () => {
    if (!hasConsented) return;
    try {
      // Create verification session
      const res = await fetch("/api/verification/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.alreadyVerified) {
        onSuccess(intendedMode || undefined);
        onClose();
        return;
      }
      if (data.session?.sessionId) {
        setSessionId(data.session.sessionId);
      }
      if (data.mode) {
        setActiveMode(data.mode);
      }
      setStep("document");
    } catch (err) {
      console.error("Session creation error:", err);
      setStep("document");
    }
  };

  const handleDocumentContinue = () => {
    if (!documentFile.base64) {
      setDocError("Please select or upload a valid photo ID document to continue.");
      return;
    }
    setStep("selfie");
    // Automatically start camera when moving to selfie step
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  // Submit complete verification
  const handleFinalSubmit = async () => {
    if (!selfieCaptured.base64) {
      setCameraError("Please capture your live selfie before proceeding.");
      return;
    }

    setStep("processing");
    setProcessingProgress(20);
    setProcessingStageText("Validating document authenticity...");

    try {
      // 1. Submit Document
      setProcessingProgress(35);
      const docRes = await fetch("/api/verification/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId || "temp_session",
          documentType,
          documentFile: {
            mimeType: documentFile.file?.type || "image/jpeg",
            sizeBytes: documentFile.file?.size || 1024 * 500,
            base64Data: documentFile.base64,
            fileName: documentFile.file?.name || "document.jpg",
          },
        }),
      });

      const docData = await docRes.json();
      if (!docRes.ok || !docData.success) {
        setStep("result");
        setVerificationResult({
          status: "ID_FAILED",
          errorMessage: docData.error || "Document verification failed. Please try again with clear lighting.",
        });
        return;
      }

      // 2. Submit Selfie & Match
      setProcessingProgress(65);
      setProcessingStageText("Running 3D live facial anti-spoofing check...");

      await new Promise((r) => setTimeout(r, 600));

      setProcessingProgress(85);
      setProcessingStageText("Biometric cross-matching face vectors...");

      const selfieRes = await fetch("/api/verification/selfie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId || "temp_session",
          selfieFile: {
            mimeType: "image/jpeg",
            sizeBytes: 1024 * 250,
            base64Data: selfieCaptured.base64,
          },
        }),
      });

      const selfieData = await selfieRes.json();
      setProcessingProgress(100);

      if (selfieData.status === "VERIFIED") {
        setStep("result");
        setVerificationResult({
          status: "VERIFIED",
          confidenceScore: selfieData.confidenceScore || 0.98,
        });
        // Auto trigger success callback
        setTimeout(() => {
          onSuccess(intendedMode || undefined);
        }, 1800);
      } else if (selfieData.status === "REVIEW_PENDING") {
        setStep("result");
        setVerificationResult({
          status: "REVIEW_PENDING",
          errorMessage: selfieData.message || "Your verification is undergoing standard review by our safety team.",
        });
      } else {
        setStep("result");
        setVerificationResult({
          status: "REJECTED",
          errorMessage: selfieData.error || "Live selfie check failed. Please ensure adequate lighting and hold still.",
        });
      }
    } catch (err: any) {
      setStep("result");
      setVerificationResult({
        status: "REJECTED",
        errorMessage: err.message || "Network error occurred during verification processing.",
      });
    }
  };

  const getTargetCategoryLabel = (mode?: CreateMode | null) => {
    switch (mode) {
      case "companion":
        return "Companion Activity";
      case "travel":
        return "Travel Trip";
      case "grow":
        return "Nature & Humanity Cause";
      case "treasure":
        return "Treasure Quest";
      case "find-me":
        return "Find Me Clue";
      default:
        return "Protected Creation Flow";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-emerald-950/60 flex items-center justify-between bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                <span>Identity Verification</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 uppercase tracking-wider">
                  One-Time
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unlock Activity & Travel • Nature & Humanity • Treasure & Clue
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-step Breadcrumb Tracker */}
        {step !== "processing" && (
          <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-[#15201b] border-b border-slate-100 dark:border-emerald-950/40 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === "consent"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                1
              </span>
              <span className={step === "consent" ? "font-bold text-slate-900 dark:text-white" : ""}>Consent</span>
            </div>
            <div className="w-4 h-[1px] bg-slate-300 dark:bg-emerald-950/80" />
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === "document"
                    ? "bg-emerald-600 text-white"
                    : step === "selfie" || step === "result"
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                2
              </span>
              <span className={step === "document" ? "font-bold text-slate-900 dark:text-white" : ""}>Photo ID</span>
            </div>
            <div className="w-4 h-[1px] bg-slate-300 dark:bg-emerald-950/80" />
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === "selfie"
                    ? "bg-emerald-600 text-white"
                    : step === "result"
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                3
              </span>
              <span className={step === "selfie" ? "font-bold text-slate-900 dark:text-white" : ""}>Live Selfie</span>
            </div>
          </div>
        )}

        {/* Modal Body Stages */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {/* STAGE 1: CONSENT & OVERVIEW */}
          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {step === "consent" && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                      Why is verification required?
                    </h3>
                    <p className="text-xs text-emerald-900/80 dark:text-emerald-300/80 mt-1 leading-relaxed">
                      To keep Travally authentic and safe for all members, hosting community activities, group travel
                      expeditions, cause initiatives, and clue drops requires a one-time identity verification.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  What you will need:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/80 flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Accepted Photo ID</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Passport, DL, PAN, or Voter ID</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/80 flex items-center gap-2.5">
                    <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Live Camera Selfie</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Quick 3D liveness match</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Privacy & Consent Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Privacy & Biometric Data Disclosure</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your identity evidence is processed through secure TLS encryption and compared against your live selfie.
                  Personal document numbers and biometric templates are not published, shared with third parties, or
                  retained indefinitely.
                </p>
                <label className="flex items-start gap-2.5 pt-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="verificationConsentCheckbox"
                    checked={hasConsented}
                    onChange={(e) => setHasConsented(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 dark:bg-slate-900 dark:border-emerald-950"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    I consent to one-time government ID verification and live selfie liveness detection for community safety.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-950 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!hasConsented}
                  onClick={handleStartVerification}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all ${
                    hasConsented
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 cursor-pointer"
                      : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <span>Continue to Photo ID</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {/* STAGE 2: PHOTO ID SELECTION & UPLOAD */}
          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {step === "document" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Select ID Document Type:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DOCUMENT_OPTIONS.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setDocumentType(doc.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        documentType === doc.id
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold shadow-xs"
                          : "bg-slate-50 dark:bg-[#16201b] border-slate-200 dark:border-emerald-950/60 text-slate-700 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-xs font-bold truncate">{doc.label}</p>
                      <p className="text-[9.5px] opacity-70 truncate">{doc.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Drop Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Upload Photo of ID (Front):
                </label>
                {!documentFile.previewUrl ? (
                  <label className="border-2 border-dashed border-slate-200 dark:border-emerald-950/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50/80 dark:hover:bg-[#16201b]/60 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Click to select or drag & drop photo of ID
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      JPG, PNG, WebP up to 5MB. Must be crisp and legible.
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative rounded-2xl border border-slate-200 dark:border-emerald-950 overflow-hidden bg-slate-900/5 dark:bg-black/40 p-2 flex items-center gap-3">
                    <img
                      src={documentFile.previewUrl}
                      alt="Uploaded ID Preview"
                      className="w-20 h-16 object-cover rounded-xl border border-slate-200 dark:border-emerald-950"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {documentFile.file?.name || "id_document.jpg"}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready for authenticity check</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDocumentFile({ file: null, previewUrl: null, base64: null })}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Document Requirements Checklist */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/80 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <p className="font-bold text-slate-700 dark:text-slate-300">Tips for fast approval:</p>
                <div className="grid grid-cols-2 gap-1 text-[10.5px]">
                  <span className="flex items-center gap-1">✓ All 4 corners visible</span>
                  <span className="flex items-center gap-1">✓ No glare or strong shadow</span>
                  <span className="flex items-center gap-1">✓ Clear, unblurred face</span>
                  <span className="flex items-center gap-1">✓ Original ID document</span>
                </div>
              </div>

              {docError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{docError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("consent")}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-950 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!documentFile.base64}
                  onClick={handleDocumentContinue}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all ${
                    documentFile.base64
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 cursor-pointer"
                      : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <span>Continue to Live Selfie</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {/* STAGE 3: LIVE CAMERA SELFIE */}
          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {step === "selfie" && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Position your face in the camera oval
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  We'll verify you are the live individual matching the ID portrait.
                </p>
              </div>

              {/* Live Camera Viewfinder */}
              <div className="relative w-full max-w-sm mx-auto aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500/50 flex items-center justify-center shadow-inner">
                {!selfieCaptured.previewUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />

                    {/* Face Oval Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-44 h-56 rounded-full border-2 border-dashed border-emerald-400/90 shadow-2xl animate-pulse flex items-center justify-center">
                        <span className="text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded-full font-bold">
                          Center Face
                        </span>
                      </div>
                    </div>

                    {!isCameraActive && !cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-4 text-center">
                        <Loader2 className="w-7 h-7 text-emerald-400 animate-spin mb-2" />
                        <p className="text-xs text-slate-300 font-semibold">Initializing front camera...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={selfieCaptured.previewUrl}
                      alt="Captured Live Selfie"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded-xl bg-black/60 backdrop-blur-xs text-white text-center text-[10px] font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Live selfie frame captured</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Error Message */}
              {cameraError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-rose-300 dark:border-rose-800 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                  >
                    Retry Camera Access
                  </button>
                </div>
              )}

              {/* Camera Control Actions */}
              <div className="flex items-center justify-center gap-3">
                {!selfieCaptured.previewUrl ? (
                  <button
                    type="button"
                    disabled={!isCameraActive}
                    onClick={handleCaptureSelfie}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-bold text-white flex items-center gap-2 shadow-md ${
                      isCameraActive
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/20 cursor-pointer scale-105 transition-transform"
                        : "bg-slate-400 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Live Selfie</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRetakeSelfie}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-emerald-950 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake Selfie</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-emerald-950/60">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setStep("document");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-950 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Back to ID
                </button>
                <button
                  type="button"
                  disabled={!selfieCaptured.base64}
                  onClick={handleFinalSubmit}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all ${
                    selfieCaptured.base64
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 cursor-pointer"
                      : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <span>Submit for Verification</span>
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {/* STAGE 4: PROCESSING & BIOMETRIC ANALYSIS */}
          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {step === "processing" && (
            <div className="py-8 px-4 text-center space-y-5 animate-fade-in">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Verifying Identity Credentials
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{processingStageText}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs mx-auto bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                  initial={{ width: "10%" }}
                  animate={{ width: `${processingProgress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              <div className="space-y-1.5 text-left max-w-xs mx-auto text-[11px] text-slate-500 dark:text-slate-400 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      processingProgress >= 35 ? "text-emerald-500" : "text-slate-300 dark:text-slate-700"
                    }`}
                  />
                  <span>Document authenticity validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      processingProgress >= 65 ? "text-emerald-500" : "text-slate-300 dark:text-slate-700"
                    }`}
                  />
                  <span>3D live human presence detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      processingProgress >= 90 ? "text-emerald-500" : "text-slate-300 dark:text-slate-700"
                    }`}
                  />
                  <span>Facial biometric vector cross-matching</span>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {/* STAGE 5: RESULT (SUCCESS / FAILED / REVIEW PENDING) */}
          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {step === "result" && (
            <div className="py-4 text-center space-y-4 animate-fade-in">
              {/* SUCCESS */}
              {verificationResult.status === "VERIFIED" && (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Identity Verified Successfully!
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Your account is verified. You now have full permanent access to Activity & Travel, Nature &
                      Humanity, and Treasure & Clue.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-semibold text-emerald-900 dark:text-emerald-200 max-w-sm mx-auto flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Unlocked: {getTargetCategoryLabel(intendedMode)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSuccess(intendedMode || undefined);
                      onClose();
                    }}
                    className="w-full max-w-xs mx-auto py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer block"
                  >
                    Continue to {getTargetCategoryLabel(intendedMode)}
                  </button>
                </div>
              )}

              {/* REVIEW PENDING */}
              {verificationResult.status === "REVIEW_PENDING" && (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border-2 border-amber-500 shadow-lg">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Verification Under Review
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      {verificationResult.errorMessage ||
                        "Your verification documents are undergoing standard manual review. You will receive an update once approved."}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 max-w-sm mx-auto">
                    Note: Protected creation features remain locked until review resolution.
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-950 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* FAILURE / REJECTED */}
              {(verificationResult.status === "ID_FAILED" ||
                verificationResult.status === "REJECTED" ||
                verificationResult.status === "NOT_STARTED") && (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border-2 border-rose-500 shadow-lg">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Verification Could Not Be Completed
                    </h3>
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-sm mx-auto font-medium">
                      {verificationResult.errorMessage ||
                        "Verification check failed. Please ensure the document is clear and matches your live selfie."}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-950 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("document")}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Neetix Engine Information Bar & Limitations Disclosure */}
        <div className="p-3 bg-slate-50 dark:bg-[#0c120f] border-t border-slate-200 dark:border-emerald-950/80 text-[10.5px] text-slate-500 dark:text-slate-400 space-y-1">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Neetix Liveliness Engine</span>
            </span>
            {activeMode === "live" ? (
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-mono text-[9.5px] font-bold border border-emerald-500/30">
                LIVE MODE
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-mono text-[9.5px] font-bold border border-amber-500/30">
                TEST MODE
              </span>
            )}
          </div>
          <p className="text-[9.5px] text-slate-400 leading-normal">
            {activeMode === "live"
              ? "Live active anti-spoof liveness and 1:1 facial biometric cross-matching powered by Neetix. Production verified credentials."
              : "Verifies ID image format, anti-spoof liveness, and 1:1 facial biometric cross-matching. Test environment credentials."}
          </p>
        </div>
      </div>
    </div>
  );
};
