"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Compass,
  Navigation,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  StopCircle,
  LocateFixed,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

interface LiveLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    messageId?: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    displayName: string;
    avatarUrl?: string;
    liveUntil?: string;
    isActive?: boolean;
    note?: string;
    address?: string;
  } | null;
  isMe?: boolean;
  onStopSharing?: (messageId: string) => void;
}

export const LiveLocationModal: React.FC<LiveLocationModalProps> = ({
  isOpen,
  onClose,
  data,
  isMe,
  onStopSharing,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [mapError, setMapError] = useState(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get viewer's current location to compute distance
  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { timeout: 5000 }
    );
  }, [isOpen]);

  // Compute Haversine distance
  const distanceString = React.useMemo(() => {
    if (!myLocation || !data) return null;
    const R = 6371; // Earth's radius in km
    const dLat = ((data.latitude - myLocation.lat) * Math.PI) / 180;
    const dLon = ((data.longitude - myLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((myLocation.lat * Math.PI) / 180) *
        Math.cos((data.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R * c;
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)} meters away`;
    }
    return `${distKm.toFixed(1)} km away`;
  }, [myLocation, data]);

  // Leaflet map setup
  useEffect(() => {
    if (!isOpen || !data || typeof window === "undefined" || !mapContainerRef.current) return;

    let L: any;

    import("leaflet")
      .then((leafletModule) => {
        L = leafletModule.default || leafletModule;

        if (!mapInstanceRef.current && mapContainerRef.current) {
          const map = L.map(mapContainerRef.current, {
            center: [data.latitude, data.longitude],
            zoom: 16,
            zoomControl: false,
          });

          // OpenStreetMap tile layer
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          }).addTo(map);

          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        if (!map) return;

        const pulseRing = data.isActive
          ? `<div style="position: absolute; inset: -8px; background: rgba(16, 185, 129, 0.4); border-radius: 9999px; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
          : "";

        const avatarContent = data.avatarUrl
          ? `<img src="${data.avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 9999px;" />`
          : data.displayName.charAt(0).toUpperCase();

        const customIcon = L.divIcon({
          className: "travally-live-avatar-pin-modal",
          html: `
            <div style="position: relative; width: 44px; height: 44px; display: flex; items-center; justify-content: center;">
              ${pulseRing}
              <div style="position: relative; width: 44px; height: 44px; background: ${
                data.isActive ? "#059669" : "#64748b"
              }; border: 3px solid white; border-radius: 9999px; box-shadow: 0 6px 16px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 16px; overflow: hidden;">
                ${avatarContent}
              </div>
              <div style="position: absolute; -bottom: 3px; width: 10px; height: 10px; background: ${
                data.isActive ? "#10b981" : "#94a3b8"
              }; border-radius: 9999px; border: 2px solid white;"></div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        if (markerRef.current) {
          markerRef.current.setLatLng([data.latitude, data.longitude]);
          markerRef.current.setIcon(customIcon);
        } else {
          markerRef.current = L.marker([data.latitude, data.longitude], { icon: customIcon }).addTo(map);
        }

        if (data.accuracy && data.accuracy > 0 && data.isActive) {
          if (circleRef.current) {
            circleRef.current.setLatLng([data.latitude, data.longitude]);
            circleRef.current.setRadius(data.accuracy);
          } else {
            circleRef.current = L.circle([data.latitude, data.longitude], {
              radius: data.accuracy,
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 0.15,
              weight: 1.5,
            }).addTo(map);
          }
        } else if (circleRef.current) {
          circleRef.current.remove();
          circleRef.current = null;
        }

        map.panTo([data.latitude, data.longitude]);
      })
      .catch((err) => {
        console.warn("Leaflet error:", err);
        setMapError(true);
      });

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const isExpired = data.liveUntil ? new Date(data.liveUntil).getTime() <= Date.now() : false;
  const isCurrentlyActive = Boolean(data.isActive) && !isExpired;

  const handleRecenter = () => {
    if (mapInstanceRef.current && data) {
      mapInstanceRef.current.setView([data.latitude, data.longitude], 16, { animate: true });
    }
  };

  const formattedLiveUntil = data.liveUntil
    ? new Date(data.liveUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl h-[85vh] max-h-[700px] bg-white dark:bg-[#111815] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-emerald-950/80 flex flex-col">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-emerald-950/80 flex items-center justify-between bg-white/95 dark:bg-[#111815]/95 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-emerald-600 text-white font-bold flex items-center justify-center text-sm border-2 border-white dark:border-emerald-950 shadow-sm shrink-0">
              {data.avatarUrl ? (
                <img src={data.avatarUrl} alt={data.displayName} className="w-full h-full object-cover" />
              ) : (
                data.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                  {data.displayName}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Travally Verified</span>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {isCurrentlyActive ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Live location • until {formattedLiveUntil}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>Live location ended</span>
                  </span>
                )}
                {distanceString && (
                  <span className="text-xs text-slate-400 font-medium">• {distanceString}</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#1b2621] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 w-full bg-slate-100 dark:bg-[#0c120f] overflow-hidden">
          {mapError ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
              <Compass className="w-10 h-10 text-emerald-600 animate-pulse" />
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Live GPS Location Tracking Active
              </p>
              <p className="text-xs text-slate-500 font-mono">
                {data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}
              </p>
            </div>
          ) : (
            <div ref={mapContainerRef} className="w-full h-full" />
          )}

          {/* Floating Controls */}
          <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleRecenter}
              className="w-10 h-10 rounded-2xl bg-white/95 dark:bg-[#111815]/95 backdrop-blur-md border border-slate-200 dark:border-emerald-950/80 shadow-md text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              title="Recenter on traveler"
            >
              <LocateFixed className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Drawer Actions */}
        <div className="p-4 sm:p-5 bg-white/95 dark:bg-[#111815]/95 backdrop-blur-md border-t border-slate-200 dark:border-emerald-950/80 shrink-0 space-y-3">
          {data.note && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/80 dark:border-emerald-950/80 text-xs text-slate-700 dark:text-slate-300">
              <strong className="block font-semibold text-[11px] text-slate-500 mb-0.5">Note:</strong>
              <p>{data.note}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {data.address ? (
                <div className="flex items-center gap-1.5 truncate max-w-xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{data.address}</span>
                </div>
              ) : (
                <span className="font-mono text-[11px]">
                  {data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}{" "}
                  {data.accuracy ? `(±${Math.round(data.accuracy)}m)` : ""}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              {isMe && isCurrentlyActive && onStopSharing && data.messageId && (
                <button
                  type="button"
                  onClick={() => {
                    onStopSharing(data.messageId!);
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Stop sharing</span>
                </button>
              )}

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${data.latitude},${data.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
