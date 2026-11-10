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
  CreditCard,
  ChevronDown,
  SwitchCamera,
  ImageIcon,
  RotateCcw,
  Check,
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

const DOCUMENT_OPTIONS: {
  id: DocumentType;
  label: string;
  description: string;
  badge: string;
  cardRatio: string;
}[] = [
  {
    id: "PAN_CARD",
    label: "PAN Card",
    description: "Income Tax Department photo card",
    badge: "India",
    cardRatio: "aspect-[1.58/1]",
  },
  {
    id: "PASSPORT",
    label: "Passport",
    description: "All official national passports",
    badge: "Global",
    cardRatio: "aspect-[1.42/1]",
  },
  {
    id: "DRIVING_LICENSE",
    label: "Driver's License",
    description: "Government issued driving card",
    badge: "Transport",
    cardRatio: "aspect-[1.58/1]",
  },
  {
    id: "VOTER_ID",
    label: "Voter ID",
    description: "Election Commission photo identity card",
    badge: "Election",
    cardRatio: "aspect-[1.58/1]",
  },
  {
    id: "NATIONAL_ID",
    label: "National ID",
    description: "Government issued photo identification",
    badge: "National",
    cardRatio: "aspect-[1.58/1]",
  },
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
  const [documentType, setDocumentType] = useState<DocumentType | "">("");
  const [documentFile, setDocumentFile] = useState<{
    file: File | null;
    previewUrl: string | null;
    base64: string | null;
  }>({ file: null, previewUrl: null, base64: null });
  const [docError, setDocError] = useState<string | null>(null);

  const [isDocCameraActive, setIsDocCameraActive] = useState<boolean>(false);
  const [docCameraError, setDocCameraError] = useState<string | null>(null);
  const [docFacingMode, setDocFacingMode] = useState<"environment" | "user">("environment");
  const docVideoRef = useRef<HTMLVideoElement | null>(null);
  const docStreamRef = useRef<MediaStream | null>(null);
  const docFileInputRef = useRef<HTMLInputElement | null>(null);

  // Custom ID Document Selector Dropdown State
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState<boolean>(false);
  const docDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close custom dropdown on outside click or tap
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (docDropdownRef.current && !docDropdownRef.current.contains(e.target as Node)) {
        setIsDocDropdownOpen(false);
      }
    };
    if (isDocDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isDocDropdownOpen]);

  // Real-time e-KYC Document Inspection State
  const [docInspection, setDocInspection] = useState<{
    status: "idle" | "valid" | "error";
    isAccepted: boolean;
    verdictTitle: string;
    verdictDescription: string;
    checks: {
      portrait: { passed: boolean; label: string; detail: string };
      clarity: { passed: boolean; label: string; detail: string };
      lighting: { passed: boolean; label: string; detail: string };
      framing: { passed: boolean; label: string; detail: string };
    };
    detectedType?: DocumentType | null;
    aspectRatio?: number;
    dimensions?: { width: number; height: number };
  }>({
    status: "idle",
    isAccepted: false,
    verdictTitle: "",
    verdictDescription: "",
    checks: {
      portrait: { passed: false, label: "Photo ID", detail: "Awaiting document" },
      clarity: { passed: false, label: "Clarity", detail: "Awaiting document" },
      lighting: { passed: false, label: "Lighting", detail: "Awaiting document" },
      framing: { passed: false, label: "Framing", detail: "Awaiting document" },
    },
  });

  // Camera state for selfie
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFaceAligned, setIsFaceAligned] = useState<boolean>(false);
  const [blinkCount, setBlinkCount] = useState<number>(0);
  const [selfieCaptured, setSelfieCaptured] = useState<{
    previewUrl: string | null;
    base64: string | null;
  }>({ previewUrl: null, base64: null });

  // Ref tracking face alignment and blink detection in selfie video loop
  const selfieTrackerRef = useRef<{
    animId: number | null;
    baselineContrast: number;
    isEyeClosed: boolean;
    eyeClosedAt: number;
    blinkCount: number;
    lastBlinkTime: number;
    isAligned: boolean;
    alignedFrames: number;
    unalignedFrames: number;
  }>({
    animId: null,
    baselineContrast: 0,
    isEyeClosed: false,
    eyeClosedAt: 0,
    blinkCount: 0,
    lastBlinkTime: 0,
    isAligned: false,
    alignedFrames: 0,
    unalignedFrames: 0,
  });

  // Verification processing & result
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStarting, setSessionStarting] = useState<boolean>(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(10);
  const [processingStageText, setProcessingStageText] = useState<string>("Analyzing document authenticity...");
  const [verificationResult, setVerificationResult] = useState<{
    status: VerificationStatus;
    errorMessage?: string;
    confidenceScore?: number;
  }>({ status: "NOT_STARTED" });

  // Video & Canvas references for selfie
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (selfieTrackerRef.current.animId) {
      cancelAnimationFrame(selfieTrackerRef.current.animId);
      selfieTrackerRef.current.animId = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const stopDocCamera = useCallback(() => {
    if (docStreamRef.current) {
      docStreamRef.current.getTracks().forEach((track) => track.stop());
      docStreamRef.current = null;
    }
    setIsDocCameraActive(false);
  }, []);

  const stopAllCameras = useCallback(() => {
    stopCamera();
    stopDocCamera();
  }, [stopCamera, stopDocCamera]);

  // Clean up cameras when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("consent");
      setHasConsented(false);
      setConsentError(null);
      setDocumentType("");
      setIsDocDropdownOpen(false);
      setDocError(null);
      setCameraError(null);
      setDocCameraError(null);
      setDocumentFile({ file: null, previewUrl: null, base64: null });
      setDocInspection({
        status: "idle",
        isAccepted: false,
        verdictTitle: "",
        verdictDescription: "",
        checks: {
          portrait: { passed: false, label: "Photo ID", detail: "Awaiting document" },
          clarity: { passed: false, label: "Clarity", detail: "Awaiting document" },
          lighting: { passed: false, label: "Lighting", detail: "Awaiting document" },
          framing: { passed: false, label: "Framing", detail: "Awaiting document" },
        },
      });
      setSelfieCaptured({ previewUrl: null, base64: null });
      setIsFaceAligned(false);
      setBlinkCount(0);
      setVerificationResult({ status: "NOT_STARTED" });
      setProcessingProgress(10);
    } else {
      stopAllCameras();
    }
  }, [isOpen, stopAllCameras]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllCameras();
    };
  }, [stopAllCameras]);

  // Document Camera Streaming with border lines overlay
  const startDocCamera = useCallback(async (facing: "environment" | "user" = docFacingMode) => {
    setDocCameraError(null);
    stopDocCamera();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920, min: 1024 },
            height: { ideal: 1080, min: 720 },
          },
          audio: false,
        });
      } catch (envErr) {
        // Fallback to default user camera if environment camera fails (e.g. desktop webcam)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      }
      docStreamRef.current = stream;
      if (docVideoRef.current) {
        docVideoRef.current.srcObject = stream;
        await docVideoRef.current.play();
      }
      setIsDocCameraActive(true);
    } catch (err: any) {
      console.warn("Document camera access error:", err);
      let msg = "Could not access camera. Please allow camera permissions.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera access in your address bar.";
      }
      setDocCameraError(msg);
      setIsDocCameraActive(false);
    }
  }, [docFacingMode, stopDocCamera]);

  const toggleDocCameraFacing = () => {
    const nextFacing = docFacingMode === "environment" ? "user" : "environment";
    setDocFacingMode(nextFacing);
    startDocCamera(nextFacing);
  };

  // Instant e-KYC Document Analysis: checks Portrait Photo, Text Clarity (Blur), Lighting/Glare, and Card Framing
  const validateDocumentImage = useCallback((dataUrl: string, file: File | null, type: DocumentType | "") => {
    if (!type) {
      setDocInspection({
        status: "error",
        isAccepted: false,
        verdictTitle: "Document Type Missing",
        verdictDescription: "Please select an ID Document Type from the dropdown first.",
        checks: {
          portrait: { passed: false, label: "Photo ID", detail: "Select document type" },
          clarity: { passed: false, label: "Clarity", detail: "Select document type" },
          lighting: { passed: false, label: "Lighting", detail: "Select document type" },
          framing: { passed: false, label: "Framing", detail: "Select document type" },
        },
      });
      return;
    }

    const rawName = (file?.name || "").toLowerCase();

    // Check name indicators for mismatch warning
    const isPanKeyword = /pan[_\-\s]?card|pan|income[_\-\s]?tax/i.test(rawName);
    const isPassportKeyword = /passport|mrz|republic/i.test(rawName);
    const isDlKeyword = /driving|driver|license|licence|dl[_\-\s]/i.test(rawName);
    const isVoterKeyword = /voter|election|epic/i.test(rawName);
    const isNationalKeyword = /national[_\-\s]?id|aadhaar|aadhar/i.test(rawName);

    let suspectedType: DocumentType | null = null;
    if (isPassportKeyword && type !== "PASSPORT") suspectedType = "PASSPORT";
    else if (isPanKeyword && type !== "PAN_CARD") suspectedType = "PAN_CARD";
    else if (isDlKeyword && type !== "DRIVING_LICENSE") suspectedType = "DRIVING_LICENSE";
    else if (isVoterKeyword && type !== "VOTER_ID") suspectedType = "VOTER_ID";
    else if (isNationalKeyword && type !== "NATIONAL_ID" && type !== "PAN_CARD") suspectedType = "NATIONAL_ID";

    const img = new Image();
    img.onload = async () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const ratio = w / h;

      const canvas = document.createElement("canvas");
      canvas.width = 240;
      canvas.height = 160;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, 240, 160);
      const imgData = ctx.getImageData(0, 0, 240, 160).data;
      const totalPixels = 240 * 160;

      let totalLum = 0;
      let glarePixels = 0;
      let flatPixelCount = 0;

      // Grayscale luminance map for edge sharpness analysis
      const gray = new Float32Array(totalPixels);

      for (let y = 0; y < 160; y++) {
        for (let x = 0; x < 240; x++) {
          const idx = (y * 240 + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          gray[y * 240 + x] = lum;
          totalLum += lum;

          if (lum > 248) glarePixels++;

          // Digital Flat Color Run Analysis (screenshots of UI/dialogs have high runs of identical horizontal pixels)
          if (x < 239) {
            const nextIdx = (y * 240 + x + 1) * 4;
            if (
              r === imgData[nextIdx] &&
              g === imgData[nextIdx + 1] &&
              b === imgData[nextIdx + 2]
            ) {
              flatPixelCount++;
            }
          }
        }
      }

      const avgLum = totalLum / totalPixels;
      const glareRatio = glarePixels / totalPixels;
      const flatRatio = flatPixelCount / (240 * 159);

      // Laplacian edge sharpness (blur & text line density detection)
      let laplacianSum = 0;
      let laplacianCount = 0;
      const laplacianVals: number[] = [];

      for (let y = 2; y < 158; y += 2) {
        for (let x = 2; x < 238; x += 2) {
          const idx = y * 240 + x;
          const lap =
            gray[idx - 240] +
            gray[idx + 240] +
            gray[idx - 1] +
            gray[idx + 1] -
            4 * gray[idx];
          laplacianSum += lap;
          laplacianVals.push(lap);
          laplacianCount++;
        }
      }

      const lapMean = laplacianSum / (laplacianCount || 1);
      let lapVar = 0;
      for (let i = 0; i < laplacianVals.length; i++) {
        const d = laplacianVals[i] - lapMean;
        lapVar += d * d;
      }
      const sharpnessScore = Math.sqrt(lapVar / (laplacianCount || 1));

      // 1. CHECKPOINT: Face / Portrait Detection on Document
      // Run FaceDetector in Chromium browsers (Chrome/Edge) to verify ID card portrait vs full-screen selfie
      let detectedFaceRatio = 0;
      let faceFound = false;

      if (typeof window !== "undefined" && "FaceDetector" in window) {
        try {
          const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
          const detectedFaces = await detector.detect(img);
          if (detectedFaces && detectedFaces.length > 0) {
            faceFound = true;
            const b = detectedFaces[0].boundingBox;
            detectedFaceRatio = b.width / w;
          }
        } catch (e) {
          // ignore detector error
        }
      }

      // Check for screenshots & screen captures (e.g. computer desktop, web browser popups, snips)
      const isScreenshotName =
        /screenshot|screen_shot|screen\s*shot|snip|snip_tool|screen\s*capture|\bss[_\-\s\.]|\bss$|\bcap[_\-\s]/i.test(
          rawName
        );
      const isCameraCapture = /camera_capture/i.test(rawName);
      const isCardName =
        /pan|card|id|doc|license|licence|passport|voter|aadhaar|aadhar|identity|national|govt|tax|driving/i.test(
          rawName
        );

      // A digital screenshot has screenshot naming OR high runs of identical flat UI pixels without camera capture or card name
      const isScreenshot = isScreenshotName || (!isCameraCapture && !isCardName && flatRatio > 0.28);

      // Check for explicit selfie file naming
      const isExplicitSelfieFile =
        /selfie|front_cam|front_camera|my_face|portrait_me/i.test(rawName) &&
        !isCardName;

      // A personal selfie is when a human face dominates > 48% of the entire picture
      const isSelfie = !isScreenshot && ((faceFound && detectedFaceRatio > 0.48) || isExplicitSelfieFile);

      let portraitCheck: { passed: boolean; label: string; detail: string };
      if (isScreenshot) {
        portraitCheck = {
          passed: false,
          label: "Document",
          detail: "Screenshot detected. Upload physical ID card.",
        };
      } else if (isSelfie) {
        portraitCheck = {
          passed: false,
          label: "Photo ID",
          detail: "Selfie detected. Upload physical ID card.",
        };
      } else {
        portraitCheck = {
          passed: true,
          label: "Photo ID",
          detail: "ID document accepted.",
        };
      }

      // 2. CHECKPOINT: Text Clarity & Blur Detection
      const isSharp = sharpnessScore >= 6 && w >= 200 && h >= 120;
      let clarityCheck: { passed: boolean; label: string; detail: string };
      if (isScreenshot) {
        clarityCheck = {
          passed: true,
          label: "Clarity",
          detail: "Text and numbers are legible.",
        };
      } else if (isSharp) {
        clarityCheck = {
          passed: true,
          label: "Clarity",
          detail: "Text and numbers are sharp and legible.",
        };
      } else {
        clarityCheck = {
          passed: false,
          label: "Clarity",
          detail: "Text is blurry. Hold camera steady and retake.",
        };
      }

      // 3. CHECKPOINT: Lighting & Glare
      let lightingCheck: { passed: boolean; label: string; detail: string };
      if (isScreenshot) {
        lightingCheck = {
          passed: true,
          label: "Lighting",
          detail: "Lighting is clear.",
        };
      } else if (avgLum < 18) {
        lightingCheck = {
          passed: false,
          label: "Lighting",
          detail: "Photo is too dark. Move to a brighter area.",
        };
      } else if (avgLum > 248 || glareRatio >= 0.40) {
        lightingCheck = {
          passed: false,
          label: "Lighting",
          detail: "Glare detected. Avoid flash or direct light.",
        };
      } else {
        lightingCheck = {
          passed: true,
          label: "Lighting",
          detail: "Lighting is clear and even.",
        };
      }

      // 4. CHECKPOINT: Card Framing & Aspect Ratio
      const isHorizontal = ratio >= 0.88;
      let framingCheck: { passed: boolean; label: string; detail: string };
      if (isScreenshot) {
        framingCheck = {
          passed: true,
          label: "Framing",
          detail: "Card fits frame.",
        };
      } else if (!isHorizontal) {
        framingCheck = {
          passed: false,
          label: "Framing",
          detail: "Card must be horizontal. Rotate to landscape.",
        };
      } else {
        framingCheck = {
          passed: true,
          label: "Framing",
          detail: "Card fits horizontal frame.",
        };
      }

      // Overall Acceptance Verdict
      const isAccepted =
        portraitCheck.passed &&
        clarityCheck.passed &&
        lightingCheck.passed &&
        framingCheck.passed;

      let verdictTitle = isAccepted ? "Document Accepted" : "Document Verification Failed";
      let verdictDescription = isAccepted
        ? "All automated e-KYC quality checks passed. Proceed to live selfie verification."
        : "Please review the flagged checkpoints below and retake or upload a clearer photo.";

      const docLabel = DOCUMENT_OPTIONS.find((d) => d.id === type)?.label || "ID Card";
      if (suspectedType && suspectedType !== type) {
        const suspectedLabel = DOCUMENT_OPTIONS.find((d) => d.id === suspectedType)?.label || suspectedType;
        verdictDescription += ` (Note: File name suggests '${suspectedLabel}', but '${docLabel}' is selected).`;
      }

      setDocInspection({
        status: isAccepted ? "valid" : "error",
        isAccepted,
        verdictTitle,
        verdictDescription,
        checks: {
          portrait: portraitCheck,
          clarity: clarityCheck,
          lighting: lightingCheck,
          framing: framingCheck,
        },
        detectedType: suspectedType,
        dimensions: { width: w, height: h },
        aspectRatio: ratio,
      });
    };

    img.src = dataUrl;
  }, []);

  const handleCaptureDocPhoto = () => {
    if (!docVideoRef.current) return;
    const video = docVideoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Do NOT mirror ID documents so text stays readable
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    const docTypeName = documentType ? documentType.toLowerCase() : "id";
    const docName = `${docTypeName}_camera_capture.jpg`;
    setDocumentFile({
      file: new File([], docName, { type: "image/jpeg" }),
      previewUrl: dataUrl,
      base64: dataUrl,
    });
    stopDocCamera();
    if (documentType) {
      validateDocumentImage(dataUrl, { name: docName } as File, documentType);
    }
  };

  const handleRetakeDocPhoto = () => {
    setDocumentFile({ file: null, previewUrl: null, base64: null });
    setDocInspection({
      status: "idle",
      isAccepted: false,
      verdictTitle: "",
      verdictDescription: "",
      checks: {
        portrait: { passed: false, label: "Photo ID", detail: "Awaiting document" },
        clarity: { passed: false, label: "Clarity", detail: "Awaiting document" },
        lighting: { passed: false, label: "Lighting", detail: "Awaiting document" },
        framing: { passed: false, label: "Framing", detail: "Awaiting document" },
      },
    });
    startDocCamera();
  };

  const handleSelectDocumentType = (newType: DocumentType) => {
    setDocumentType(newType);
    setDocError(null);
    if (documentFile.base64) {
      validateDocumentImage(documentFile.base64, documentFile.file, newType);
    } else {
      setTimeout(() => {
        startDocCamera();
      }, 100);
    }
  };

  // Capture frame from video stream onto hidden canvas
  const handleCaptureSelfie = useCallback(() => {
    if (selfieTrackerRef.current.animId) {
      cancelAnimationFrame(selfieTrackerRef.current.animId);
      selfieTrackerRef.current.animId = null;
    }
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
  }, [stopCamera]);

  // Live video frame processing: face alignment & 2-blink auto-capture
  const startSelfieAnalysisLoop = useCallback(() => {
    if (selfieTrackerRef.current.animId) {
      cancelAnimationFrame(selfieTrackerRef.current.animId);
      selfieTrackerRef.current.animId = null;
    }

    selfieTrackerRef.current.blinkCount = 0;
    selfieTrackerRef.current.baselineContrast = 0;
    selfieTrackerRef.current.isEyeClosed = false;
    selfieTrackerRef.current.isAligned = false;
    selfieTrackerRef.current.alignedFrames = 0;
    selfieTrackerRef.current.unalignedFrames = 0;
    setBlinkCount(0);
    setIsFaceAligned(false);

    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let isProcessing = false;
    let detectorInstance: any = null;
    if (typeof window !== "undefined" && "FaceDetector" in window) {
      try {
        detectorInstance = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      } catch (e) {}
    }

    const loop = async () => {
      if (!isProcessing && videoRef.current && videoRef.current.readyState >= 2) {
        isProcessing = true;
        try {
          const video = videoRef.current;
          ctx.drawImage(video, 0, 0, 160, 120);
          const imgData = ctx.getImageData(0, 0, 160, 120).data;

          let rawAligned = false;

          // 1. Hardware FaceDetector in Chromium (Chrome/Edge)
          if (detectorInstance) {
            try {
              const faces = await detectorInstance.detect(video);
              if (faces && faces.length > 0) {
                const box = faces[0].boundingBox;
                const vw = video.videoWidth || 640;
                const vh = video.videoHeight || 480;
                const fcx = (box.x + box.width / 2) / vw;
                const fcy = (box.y + box.height / 2) / vh;
                const fsize = box.width / vw;

                // Center check: face roughly centered in frame
                if (fcx >= 0.20 && fcx <= 0.80 && fcy >= 0.15 && fcy <= 0.85 && fsize >= 0.12 && fsize <= 0.92) {
                  rawAligned = true;
                }
              }
            } catch (e) {
              // Detector fallback
            }
          }

          // 2. Adaptive YCbCr & Ambient Light Model
          if (!rawAligned) {
            let ovalSkinCount = 0;
            let ovalTotalCount = 0;
            let ovalLumSum = 0;
            const ovalLums: number[] = [];

            for (let y = 14; y < 106; y += 2) {
              for (let x = 40; x < 120; x += 2) {
                // Oval coordinates: center (80, 60), rx = 40, ry = 48
                const nx = (x - 80) / 40;
                const ny = (y - 60) / 48;
                if (nx * nx + ny * ny <= 1) {
                  const idx = (y * 160 + x) * 4;
                  const r = imgData[idx];
                  const g = imgData[idx + 1];
                  const b = imgData[idx + 2];
                  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                  ovalLumSum += lum;
                  ovalLums.push(lum);
                  ovalTotalCount++;

                  // Robust skin model: handles dim/warm lighting across diverse skin tones
                  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
                  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
                  const isSkin =
                    (cr >= 115 && cr <= 190 && cb >= 60 && cb <= 150) ||
                    (r > 16 && g > 10 && b > 6 && r >= g && (r - b) >= 1);

                  if (isSkin) ovalSkinCount++;
                }
              }
            }

            const ovalSkinRatio = ovalSkinCount / (ovalTotalCount || 1);
            const avgOvalLum = ovalLumSum / (ovalTotalCount || 1);

            // Calculate feature variance in oval
            let ovalVar = 0;
            for (let i = 0; i < ovalLums.length; i++) {
              const diff = ovalLums[i] - avgOvalLum;
              ovalVar += diff * diff;
            }
            const ovalStdDev = Math.sqrt(ovalVar / (ovalLums.length || 1));

            // Face is in oval: visible illumination with skin tones or facial contrast
            if (avgOvalLum >= 6 && (ovalSkinRatio >= 0.05 || ovalStdDev >= 2.8)) {
              rawAligned = true;
            }
          }

          // Debounce alignment state to prevent rapid flickering
          if (rawAligned) {
            selfieTrackerRef.current.alignedFrames++;
            selfieTrackerRef.current.unalignedFrames = 0;
          } else {
            selfieTrackerRef.current.unalignedFrames++;
            selfieTrackerRef.current.alignedFrames = 0;
          }

          const wasAligned = selfieTrackerRef.current.isAligned;
          let isAligned = wasAligned;

          if (!wasAligned && selfieTrackerRef.current.alignedFrames >= 2) {
            isAligned = true;
            selfieTrackerRef.current.isAligned = true;
            setIsFaceAligned(true);
          } else if (wasAligned && selfieTrackerRef.current.unalignedFrames >= 6) {
            isAligned = false;
            selfieTrackerRef.current.isAligned = false;
            setIsFaceAligned(false);
          }

          // 3. Real-time Multi-band Blink Detection
          if (isAligned) {
            // Track 3 overlapping vertical bands across the upper-mid face to accommodate
            // any head position inside the oval:
            // Band 1: y = 32..44 | Band 2: y = 42..54 | Band 3: y = 52..64
            let gSum1 = 0, c1 = 0;
            let gSum2 = 0, c2 = 0;
            let gSum3 = 0, c3 = 0;

            for (let x = 48; x <= 112; x += 2) {
              for (let y = 32; y <= 42; y += 2) {
                const i1 = (y * 160 + x) * 4;
                const i2 = ((y + 2) * 160 + x) * 4;
                const l1 = 0.299 * imgData[i1] + 0.587 * imgData[i1 + 1] + 0.114 * imgData[i1 + 2];
                const l2 = 0.299 * imgData[i2] + 0.587 * imgData[i2 + 1] + 0.114 * imgData[i2 + 2];
                gSum1 += Math.abs(l1 - l2);
                c1++;
              }
              for (let y = 42; y <= 52; y += 2) {
                const i1 = (y * 160 + x) * 4;
                const i2 = ((y + 2) * 160 + x) * 4;
                const l1 = 0.299 * imgData[i1] + 0.587 * imgData[i1 + 1] + 0.114 * imgData[i1 + 2];
                const l2 = 0.299 * imgData[i2] + 0.587 * imgData[i2 + 1] + 0.114 * imgData[i2 + 2];
                gSum2 += Math.abs(l1 - l2);
                c2++;
              }
              for (let y = 52; y <= 62; y += 2) {
                const i1 = (y * 160 + x) * 4;
                const i2 = ((y + 2) * 160 + x) * 4;
                const l1 = 0.299 * imgData[i1] + 0.587 * imgData[i1 + 1] + 0.114 * imgData[i1 + 2];
                const l2 = 0.299 * imgData[i2] + 0.587 * imgData[i2 + 1] + 0.114 * imgData[i2 + 2];
                gSum3 += Math.abs(l1 - l2);
                c3++;
              }
            }

            const grad1 = gSum1 / (c1 || 1);
            const grad2 = gSum2 / (c2 || 1);
            const grad3 = gSum3 / (c3 || 1);
            const currentContrast = Math.max(grad1, grad2, grad3);

            if (selfieTrackerRef.current.baselineContrast === 0) {
              selfieTrackerRef.current.baselineContrast = currentContrast;
            } else if (!selfieTrackerRef.current.isEyeClosed) {
              selfieTrackerRef.current.baselineContrast =
                selfieTrackerRef.current.baselineContrast * 0.86 + currentContrast * 0.14;
            }

            const baseline = selfieTrackerRef.current.baselineContrast;
            const now = Date.now();
            const ratio = currentContrast / (baseline || 1);

            // Eye closure: contrast drops below 87% with valid baseline
            if (!selfieTrackerRef.current.isEyeClosed && ratio < 0.87 && baseline >= 1.2) {
              selfieTrackerRef.current.isEyeClosed = true;
              selfieTrackerRef.current.eyeClosedAt = now;
            }
            // Eye recovery: contrast returns above 91%
            else if (selfieTrackerRef.current.isEyeClosed && ratio >= 0.91) {
              const duration = now - selfieTrackerRef.current.eyeClosedAt;
              selfieTrackerRef.current.isEyeClosed = false;

              // Valid natural human blink: 60ms to 850ms
              if (duration >= 60 && duration <= 850 && now - selfieTrackerRef.current.lastBlinkTime > 220) {
                selfieTrackerRef.current.lastBlinkTime = now;
                selfieTrackerRef.current.blinkCount += 1;
                const count = selfieTrackerRef.current.blinkCount;
                setBlinkCount(count);

                // Auto-trigger selfie capture when reaching 2 blinks!
                if (count >= 2) {
                  if (selfieTrackerRef.current.animId) {
                    cancelAnimationFrame(selfieTrackerRef.current.animId);
                    selfieTrackerRef.current.animId = null;
                  }
                  setTimeout(() => {
                    handleCaptureSelfie();
                  }, 180);
                  return;
                }
              }
            }
          } else {
            selfieTrackerRef.current.isEyeClosed = false;
          }
        } finally {
          isProcessing = false;
        }
      }

      selfieTrackerRef.current.animId = requestAnimationFrame(loop);
    };

    selfieTrackerRef.current.animId = requestAnimationFrame(loop);
  }, [handleCaptureSelfie]);

  const startCamera = async () => {
    setCameraError(null);
    setIsFaceAligned(false);
    setBlinkCount(0);
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
        startSelfieAnalysisLoop();
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

  const handleRetakeSelfie = () => {
    setSelfieCaptured({ previewUrl: null, base64: null });
    setIsFaceAligned(false);
    setBlinkCount(0);
    startCamera();
  };

  // Handle document file upload from Gallery / Device
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
      stopDocCamera();
      setDocumentFile({
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
      });
      if (documentType) {
        validateDocumentImage(base64, file, documentType);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Step transitions
  const handleStartVerification = async () => {
    if (!hasConsented) return;
    setSessionStarting(true);
    setConsentError(null);
    try {
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
      if (!res.ok || data.error || !data.session?.sessionId) {
        setConsentError(
          data.error || "Failed to initialize verification session. Please verify backend provider configuration."
        );
        return;
      }
      if (data.session?.sessionId) {
        setSessionId(data.session.sessionId);
      }
      if (data.mode) {
        setActiveMode(data.mode);
      }
      setStep("document");
      // Auto-start document camera only if document type is already chosen
      if (documentType) {
        setTimeout(() => {
          startDocCamera();
        }, 150);
      }
    } catch (err: any) {
      console.error("Session creation error:", err);
      setConsentError(err.message || "Network error while starting verification session.");
    } finally {
      setSessionStarting(false);
    }
  };

  const handleDocumentContinue = () => {
    if (!documentType) {
      setDocError("Please select an ID Document Type from the dropdown above.");
      return;
    }
    if (!documentFile.base64) {
      setDocError("Please select or upload a valid photo ID document to continue.");
      return;
    }
    if (!docInspection.isAccepted) {
      setDocError(docInspection.verdictDescription || "Please resolve the flagged document issues before proceeding.");
      return;
    }
    stopDocCamera();
    setStep("selfie");
    // Automatically start selfie camera when moving to selfie step
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  // Submit complete verification
  const handleFinalSubmit = async () => {
    if (!documentType) {
      setDocError("Please select an ID Document Type.");
      return;
    }
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
          documentType: documentType as DocumentType,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] sm:max-h-[90vh] flex flex-col">
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-emerald-950/60 flex items-center justify-between bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                <span>Identity Verification</span>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 uppercase tracking-wider">
                  One-Time
                </span>
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-step Breadcrumb Tracker */}
        {step !== "processing" && (
          <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-slate-50/70 dark:bg-[#15201b] border-b border-slate-100 dark:border-emerald-950/40 flex items-center justify-between text-[11px] sm:text-xs font-semibold shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 dark:text-slate-400">
              <span
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold ${
                  step === "consent"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                1
              </span>
              <span className={step === "consent" ? "font-bold text-slate-900 dark:text-white" : ""}>Consent</span>
            </div>
            <div className="w-3 sm:w-4 h-[1px] bg-slate-300 dark:bg-emerald-950/80" />
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 dark:text-slate-400">
              <span
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold ${
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
            <div className="w-3 sm:w-4 h-[1px] bg-slate-300 dark:bg-emerald-950/80" />
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 dark:text-slate-400">
              <span
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold ${
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
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {/* STAGE 1: CONSENT & OVERVIEW */}
          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {step === "consent" && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
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

              {consentError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{consentError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-950 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!hasConsented || sessionStarting}
                  onClick={handleStartVerification}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all ${
                    hasConsented && !sessionStarting
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 cursor-pointer"
                      : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {sessionStarting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Photo ID</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {/* STAGE 2: PHOTO ID SELECTION & CAPTURE/UPLOAD */}
          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {step === "document" && (
            <div className="space-y-4 animate-fade-in">
              {/* Custom Styled Dropdown Selector */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Select ID Document Type:
                </label>
                <div ref={docDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDocDropdownOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-left shadow-xs ${
                      isDocDropdownOpen
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-[#16201b]"
                        : documentType
                        ? "border-emerald-500/70 bg-emerald-50/20 dark:bg-[#16201b] hover:border-emerald-500"
                        : "border-slate-200 dark:border-emerald-950/80 bg-white dark:bg-[#16201b] hover:border-slate-300 dark:hover:border-emerald-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          documentType
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        {documentType ? (
                          <>
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {DOCUMENT_OPTIONS.find((d) => d.id === documentType)?.label}
                              </p>
                              {DOCUMENT_OPTIONS.find((d) => d.id === documentType)?.badge && (
                                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  {DOCUMENT_OPTIONS.find((d) => d.id === documentType)?.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {DOCUMENT_OPTIONS.find((d) => d.id === documentType)?.description}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                              -- Select ID Document Type --
                            </p>
                            <p className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 truncate">
                              Tap to choose PAN Card, Passport, Driver&apos;s License...
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {documentType && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </span>
                      )}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 transition-transform duration-200 ${
                          isDocDropdownOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {/* Dropdown Menu Popover */}
                  <AnimatePresence>
                    {isDocDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 z-40 bg-white/95 dark:bg-[#141f19]/95 backdrop-blur-xl border border-slate-200 dark:border-emerald-950/90 rounded-2xl shadow-2xl p-1.5 space-y-1 overflow-hidden"
                      >
                        {DOCUMENT_OPTIONS.map((doc) => {
                          const isSelected = documentType === doc.id;
                          return (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => {
                                handleSelectDocumentType(doc.id);
                                setIsDocDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer text-left ${
                                isSelected
                                  ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 border border-emerald-500/40 shadow-xs"
                                  : "hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 border border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "bg-emerald-500 text-white shadow-xs"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                  }`}
                                >
                                  <CreditCard className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs sm:text-sm font-bold truncate">
                                      {doc.label}
                                    </span>
                                    {doc.badge && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                        {doc.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {doc.description}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 ml-2">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Only show camera / gallery once document type is selected */}
              {!documentType ? (
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-emerald-950/80 bg-slate-50/70 dark:bg-[#16201b]/50 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Please select an ID Document Type from the dropdown above
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Select PAN Card, Passport, Driver&apos;s License, Voter ID, or National ID to start camera capture or select an image.
                  </p>
                </div>
              ) : (
                <>
                  {/* Camera Viewfinder or Captured Preview */}
                  <div>
                    {!documentFile.previewUrl ? (
                      <div className="space-y-3">
                        <div className="relative w-full max-w-[340px] sm:max-w-md mx-auto aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500/50 flex items-center justify-center shadow-lg">
                          <video
                            ref={docVideoRef}
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />

                          {/* Viewfinder Vignette Overlay with Clean Border Lines (Tailored to selected Document Type) */}
                          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-3 sm:p-4">
                            {/* Document Target Rectangle with Corner Brackets */}
                            <div
                              className={`relative w-[92%] sm:w-full max-w-[280px] sm:max-w-[320px] ${
                                documentType === "PASSPORT" ? "aspect-[1.42/1]" : "aspect-[1.58/1]"
                              } rounded-xl border-2 border-emerald-400/90 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-end pr-4`}
                            >
                              {/* 4 Prominent Corner Brackets */}
                              <div className="absolute -top-1.5 -left-1.5 w-6 sm:w-7 h-6 sm:h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                              <div className="absolute -top-1.5 -right-1.5 w-6 sm:w-7 h-6 sm:h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                              <div className="absolute -bottom-1.5 -left-1.5 w-6 sm:w-7 h-6 sm:h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                              <div className="absolute -bottom-1.5 -right-1.5 w-6 sm:w-7 h-6 sm:h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                              {/* Decorative ID Card Text Guidelines */}
                              <div className="space-y-1.5 opacity-30">
                                <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-emerald-400 rounded-full" />
                                <div className="w-12 sm:w-16 h-1 sm:h-1.5 bg-emerald-400 rounded-full" />
                                <div className="w-14 sm:w-18 h-1 sm:h-1.5 bg-emerald-400 rounded-full" />
                              </div>
                            </div>

                            {/* Bottom Instruction Pill */}
                            <div className="absolute bottom-2.5 sm:bottom-3 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-medium shadow-md bg-black/80 backdrop-blur-xs text-slate-200 border border-white/10 text-center max-w-[90%] truncate">
                              Align entire card within borders • Avoid glare
                            </div>
                          </div>

                          {!isDocCameraActive && !docCameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-4 text-center">
                              <Loader2 className="w-7 h-7 text-emerald-400 animate-spin mb-2" />
                              <p className="text-xs text-slate-300 font-semibold">Initializing camera...</p>
                            </div>
                          )}
                        </div>

                        {/* Camera Controls: Switch Camera + Capture Shutter + Gallery Button */}
                        <div className="flex items-center justify-center gap-4 sm:gap-6 pt-1">
                          {/* Switch Camera */}
                          <button
                            type="button"
                            onClick={toggleDocCameraFacing}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#16201b] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-xs flex items-center justify-center active:scale-95"
                            title="Switch camera (Front / Rear)"
                          >
                            <SwitchCamera className="w-5 h-5" />
                          </button>

                          {/* Capture ID Photo (Modern Mobile Shutter Button) */}
                          <button
                            type="button"
                            disabled={!isDocCameraActive}
                            onClick={handleCaptureDocPhoto}
                            className={`group relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all ${
                              isDocCameraActive
                                ? "ring-4 ring-emerald-500/80 hover:ring-emerald-400 active:scale-90 cursor-pointer shadow-lg shadow-emerald-500/30"
                                : "ring-4 ring-slate-300 dark:ring-slate-700 cursor-not-allowed opacity-50"
                            }`}
                            title="Capture ID Photo"
                          >
                            <div
                              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                                isDocCameraActive
                                  ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md group-hover:scale-105"
                                  : "bg-slate-300 dark:bg-slate-700 text-slate-500"
                              }`}
                            >
                              <Camera className="w-6 h-6" />
                            </div>
                          </button>

                          {/* Gallery Button */}
                          <button
                            type="button"
                            onClick={() => docFileInputRef.current?.click()}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#16201b] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-xs flex items-center justify-center active:scale-95"
                            title="Select image from gallery"
                          >
                            <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </button>

                          {/* Hidden Gallery File Input */}
                          <input
                            ref={docFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </div>

                        {docCameraError && (
                          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 space-y-2">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{docCameraError}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => startDocCamera()}
                              className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-rose-300 dark:border-rose-800 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                            >
                              Retry Camera
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Document Preview & Verification Card */
                      <div className="space-y-3">
                        <div className="relative w-full max-w-[340px] sm:max-w-md mx-auto aspect-[1.58/1] rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500/50 shadow-md">
                          <img
                            src={documentFile.previewUrl}
                            alt="Captured Document"
                            className="w-full h-full object-contain bg-slate-950"
                          />
                        </div>

                        {/* Retake Button with Arrow in Circle Symbol */}
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={handleRetakeDocPhoto}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#16201b] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Retake</span>
                          </button>
                        </div>

                        {/* Hidden file input for retaking from gallery */}
                        <input
                          ref={docFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        {/* Real-time e-KYC Document Inspection Report Card */}
                        {docInspection.status !== "idle" && (
                          <div className="space-y-2.5">
                            {docInspection.isAccepted ? (
                              /* Clean Single Line with Bullet when Successfully Accepted */
                              <div className="p-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <span>Document verified successfully</span>
                              </div>
                            ) : (
                              <>
                                {/* Overall Failure Verdict Banner */}
                                <div className="p-3 rounded-2xl border text-xs flex items-center justify-between gap-2.5 sm:gap-3 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200">
                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-rose-500 text-white">
                                      <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <p className="font-bold text-xs sm:text-sm whitespace-nowrap">
                                      {docInspection.verdictTitle}
                                    </p>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider shrink-0 whitespace-nowrap bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                                    ACTION REQUIRED
                                  </span>
                                </div>

                                {/* Single Box with Single-Line Failure Explanations */}
                                <div className="p-3 rounded-xl border bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 space-y-1.5 text-[11px] sm:text-xs">
                                  {Object.entries(docInspection.checks)
                                    .filter(([_, check]) => !check.passed)
                                    .map(([key, check]) => (
                                      <div key={key} className="flex items-center gap-2 text-rose-800 dark:text-rose-200 whitespace-nowrap overflow-hidden leading-tight">
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                        <span className="truncate">
                                          <strong className="font-bold">{check.label}:</strong> {check.detail}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </>
                            )}

                            {docInspection.detectedType && docInspection.detectedType !== documentType && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleSelectDocumentType(docInspection.detectedType!)}
                                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <span>
                                    Switch dropdown to {DOCUMENT_OPTIONS.find((d) => d.id === docInspection.detectedType)?.label}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

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
                  onClick={() => {
                    stopDocCamera();
                    setStep("consent");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-950 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!documentFile.base64 || !docInspection.isAccepted}
                  onClick={handleDocumentContinue}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all ${
                    documentFile.base64 && docInspection.isAccepted
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
              <div className="relative w-full max-w-[280px] sm:max-w-xs mx-auto aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 flex items-center justify-center shadow-inner">
                {!selfieCaptured.previewUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />

                    {/* Dynamic Face Oval Overlay: RED until aligned, GREEN when aligned */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-2 sm:p-3">
                      <div
                        className={`w-38 h-52 sm:w-46 sm:h-62 rounded-[50%] border-4 transition-all duration-300 flex flex-col items-center justify-between py-2 sm:py-3.5 ${
                          isFaceAligned
                            ? "border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.7)]"
                            : "border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.6)]"
                        }`}
                      >
                        {/* Alignment Status Pill */}
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[10.5px] font-bold shadow-md bg-black/80 backdrop-blur-xs">
                          {isFaceAligned ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Face Aligned</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span className="text-rose-300">Align Face in Oval</span>
                            </>
                          )}
                        </div>

                        {/* Real-time Blink Tracker Pill */}
                        <div className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-[10.5px] font-bold shadow-md bg-black/85 backdrop-blur-xs flex items-center gap-2 border border-white/10">
                          <span
                            className={
                              blinkCount >= 2
                                ? "text-emerald-300 font-extrabold animate-pulse"
                                : blinkCount === 1
                                ? "text-emerald-300 font-extrabold"
                                : isFaceAligned
                                ? "text-emerald-300"
                                : "text-slate-400"
                            }
                          >
                            {!isFaceAligned
                              ? "Align face to enable auto-click"
                              : blinkCount === 0
                              ? "Blink 2 times to auto-click"
                              : blinkCount === 1
                              ? "Blink 1 captured! Blink 1 more"
                              : "Blink 2 captured! Capturing..."}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {[1, 2].map((num) => (
                              <span
                                key={num}
                                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-200 ${
                                  blinkCount >= num
                                    ? "bg-emerald-400 scale-125 shadow-[0_0_8px_rgba(52,211,153,0.9)] ring-1 ring-emerald-300"
                                    : "bg-slate-600/90"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
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
              <div className="flex flex-col items-center justify-center gap-2 pt-1">
                {!selfieCaptured.previewUrl ? (
                  <>
                    <button
                      type="button"
                      disabled={!isCameraActive || !isFaceAligned}
                      onClick={handleCaptureSelfie}
                      className={`px-6 sm:px-8 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-md transition-all active:scale-95 ${
                        isCameraActive && isFaceAligned
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/30 cursor-pointer ring-2 ring-emerald-400/50 scale-102"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300/40 dark:border-slate-700/50"
                      }`}
                    >
                      {isFaceAligned ? (
                        <>
                          <Camera className="w-4 h-4 text-white" />
                          <span>Take Live Selfie</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span>Align Face in Oval to Enable</span>
                        </>
                      )}
                    </button>
                    {!isFaceAligned && isCameraActive && (
                      <p className="text-[10px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 text-center">
                        Capture button unlocks automatically once face turns green
                      </p>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleRetakeSelfie}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#16201b] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
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
        <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-[#0c120f] border-t border-slate-200 dark:border-emerald-950/80 text-[10px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 space-y-1 shrink-0">
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
