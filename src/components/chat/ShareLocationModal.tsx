"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  MapPin,
  Compass,
  Navigation,
  Send,
  Loader2,
  Clock,
  Radio,
  AlertCircle,
  LocateFixed,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

interface ShareLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareLiveLocation: (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    durationMinutes: number;
    note?: string;
    address?: string;
  }) => void;
  onSendCurrentLocation: (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address: string;
    mapLink: string;
  }) => void;
}

const DURATION_OPTIONS = [
  { label: "15 minutes", minutes: 15 },
  { label: "1 hour", minutes: 60, isDefault: true },
  { label: "8 hours", minutes: 480 },
];

export const ShareLocationModal: React.FC<ShareLocationModalProps> = ({
  isOpen,
  onClose,
  onShareLiveLocation,
  onSendCurrentLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const [loadingGps, setLoadingGps] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
  } | null>(null);

  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [comment, setComment] = useState<string>("");
  const [resolvedAddress, setResolvedAddress] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"LIVE" | "STATIC">("LIVE");

  // Fetch real device GPS coordinates
  const fetchGpsLocation = () => {
    setLoadingGps(true);
    setGpsError(null);

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGpsError("Geolocation is not supported by your browser or device.");
      setLoadingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading } = pos.coords;
        setCoordinates({
          latitude,
          longitude,
          accuracy: accuracy || 15,
          heading: heading || 0,
        });
        setLoadingGps(false);

        // Reverse geocode via OpenStreetMap Nominatim with fast fallback
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        )
          .then((res) => res.json())
          .then((data) => {
            if (data?.display_name) {
              const parts = data.display_name.split(", ");
              const shortAddr = parts.slice(0, 3).join(", ");
              setResolvedAddress(shortAddr || data.display_name);
            } else {
              setResolvedAddress(`GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            }
          })
          .catch(() => {
            setResolvedAddress(`GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          });
      },
      (err) => {
        console.warn("GPS error:", err);
        setGpsError(
          err.code === 1
            ? "Location permission denied. Please allow location access in your browser settings."
            : "Unable to detect your precise GPS location. Please check your device location settings."
        );
        // Fallback to reasonable coordinates (e.g. Bangalore center) for testing/demo
        setCoordinates({
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 50,
        });
        setResolvedAddress("Bengaluru, Karnataka, India");
        setLoadingGps(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      fetchGpsLocation();
    }
  }, [isOpen]);

  // Leaflet map setup
  useEffect(() => {
    if (!isOpen || !coordinates || typeof window === "undefined" || !mapContainerRef.current)
      return;

    let L: any;

    import("leaflet")
      .then((leafletModule) => {
        L = leafletModule.default || leafletModule;

        if (!mapInstanceRef.current && mapContainerRef.current) {
          const map = L.map(mapContainerRef.current, {
            center: [coordinates.latitude, coordinates.longitude],
            zoom: 16,
            zoomControl: false,
            attributionControl: false,
          });

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
          }).addTo(map);

          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        if (!map) return;

        const customIcon = L.divIcon({
          className: "travally-current-loc-pin",
          html: `
            <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; inset: -4px; background: rgba(16, 185, 129, 0.35); border-radius: 9999px; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; width: 36px; height: 36px; background: #059669; border: 3px solid white; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        if (markerRef.current) {
          markerRef.current.setLatLng([coordinates.latitude, coordinates.longitude]);
        } else {
          markerRef.current = L.marker([coordinates.latitude, coordinates.longitude], {
            icon: customIcon,
          }).addTo(map);
        }

        if (coordinates.accuracy && coordinates.accuracy > 0) {
          if (circleRef.current) {
            circleRef.current.setLatLng([coordinates.latitude, coordinates.longitude]);
            circleRef.current.setRadius(coordinates.accuracy);
          } else {
            circleRef.current = L.circle([coordinates.latitude, coordinates.longitude], {
              radius: coordinates.accuracy,
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 0.15,
              weight: 1.5,
            }).addTo(map);
          }
        }

        map.setView([coordinates.latitude, coordinates.longitude], 16);
      })
      .catch((err) => {
        console.warn("Leaflet preview error:", err);
      });

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, coordinates]);

  if (!isOpen) return null;

  const handleShareLive = () => {
    if (!coordinates) return;
    onShareLiveLocation({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      accuracy: coordinates.accuracy,
      heading: coordinates.heading,
      durationMinutes: selectedDuration,
      note: comment.trim() || undefined,
      address: resolvedAddress || undefined,
    });
    onClose();
  };

  const handleSendCurrent = () => {
    if (!coordinates) return;
    const mapLink = `https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}`;
    onSendCurrentLocation({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      accuracy: coordinates.accuracy,
      address:
        resolvedAddress ||
        `Coordinates: ${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`,
      mapLink,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111815] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-emerald-950/80 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-emerald-950/80 flex items-center justify-between shrink-0 bg-white/95 dark:bg-[#111815]/95 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/90 dark:to-teal-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 flex items-center justify-center shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                Share Location
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live location sharing or static meeting pin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#1b2621] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mini Map View */}
        <div className="relative h-44 sm:h-48 w-full bg-slate-100 dark:bg-[#0d1411] overflow-hidden shrink-0 border-b border-slate-200 dark:border-emerald-950/60">
          {loadingGps ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Detecting GPS location...
              </span>
            </div>
          ) : (
            <div ref={mapContainerRef} className="w-full h-full" />
          )}

          {/* GPS Accuracy Pill overlay */}
          {coordinates && !loadingGps && (
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-black/85 backdrop-blur-md border border-slate-200/80 dark:border-emerald-950/80 text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Accurate to ±{Math.round(coordinates.accuracy || 15)}m</span>
            </div>
          )}

          {/* Recenter GPS button */}
          <button
            type="button"
            onClick={fetchGpsLocation}
            className="absolute bottom-3 right-3 z-20 w-9 h-9 rounded-2xl bg-white/95 dark:bg-black/85 backdrop-blur-md border border-slate-200 dark:border-emerald-950/80 shadow-md text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Refresh GPS location"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </div>

        {/* Warning if GPS permission denied */}
        {gpsError && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200 shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">{gpsError}</p>
          </div>
        )}

        {/* Tab Switcher: Live Location vs Send Current Location */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-[#16221c] rounded-2xl border border-slate-200/80 dark:border-emerald-950/80">
            <button
              type="button"
              onClick={() => setActiveTab("LIVE")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "LIVE"
                  ? "bg-white dark:bg-[#1f2f27] text-emerald-700 dark:text-emerald-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-600" />
              <span>Share Live Location</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("STATIC")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "STATIC"
                  ? "bg-white dark:bg-[#1f2f27] text-orange-700 dark:text-orange-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MapPin className="w-4 h-4 text-orange-600" />
              <span>Send Current Location</span>
            </button>
          </div>

          {activeTab === "LIVE" ? (
            /* ── SHARE LIVE LOCATION SECTION (WHATSAPP PARITY) ── */
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    Live Location updates in real time
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Participants in this chat can see your live position on the map even when your
                    phone is locked or the app is in the background. You can stop sharing at any
                    time.
                  </p>
                </div>
              </div>

              {/* Duration selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Share live for:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_OPTIONS.map((opt) => {
                    const isSelected = selectedDuration === opt.minutes;
                    return (
                      <button
                        key={opt.minutes}
                        type="button"
                        onClick={() => setSelectedDuration(opt.minutes)}
                        className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                            : "bg-white dark:bg-[#16201b] border-slate-200 dark:border-emerald-950/80 text-slate-700 dark:text-slate-300 hover:border-emerald-500"
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment / Caption input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Add a comment <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Walking towards the cafe or meeting point..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200 dark:border-emerald-950/80 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  maxLength={120}
                />
              </div>

              {/* Submit Share Live Button */}
              <button
                type="button"
                onClick={handleShareLive}
                disabled={loadingGps || !coordinates}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Share Live Location ({DURATION_OPTIONS.find((d) => d.minutes === selectedDuration)?.label})</span>
                <Send className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          ) : (
            /* ── SEND CURRENT LOCATION (STATIC PIN) ── */
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/80 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Current Location Address:
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                  {resolvedAddress || "Detecting address..."}
                </p>
                {coordinates && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)} (±
                    {Math.round(coordinates.accuracy || 15)}m)
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleSendCurrent}
                disabled={loadingGps || !coordinates}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <MapPin className="w-4 h-4" />
                <span>Send This Static Location Pin</span>
                <Send className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
