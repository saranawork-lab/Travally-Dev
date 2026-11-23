"use client";

import React, { useEffect, useRef, useState } from "react";
import { Compass, ExternalLink } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface LiveLocationMiniMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  displayName: string;
  avatarUrl?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const LiveLocationMiniMap: React.FC<LiveLocationMiniMapProps> = ({
  latitude,
  longitude,
  accuracy,
  displayName,
  avatarUrl,
  isActive = true,
  onClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L: any;

    import("leaflet")
      .then((leafletModule) => {
        L = leafletModule.default || leafletModule;

        if (!mapInstanceRef.current && mapContainerRef.current) {
          const map = L.map(mapContainerRef.current, {
            center: [latitude, longitude],
            zoom: 15,
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false,
          });

          const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
          });

          tileLayer.on("tileerror", () => {});
          tileLayer.addTo(map);
          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        if (!map) return;

        // Custom pulsing marker with avatar
        const pulseRing = isActive
          ? `<div style="position: absolute; inset: -6px; background: rgba(16, 185, 129, 0.4); border-radius: 9999px; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
          : "";

        const avatarContent = avatarUrl
          ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 9999px;" />`
          : displayName.charAt(0).toUpperCase();

        const customIcon = L.divIcon({
          className: "travally-live-avatar-pin",
          html: `
            <div style="position: relative; width: 34px; height: 34px; display: flex; items-center; justify-content: center;">
              ${pulseRing}
              <div style="position: relative; width: 34px; height: 34px; background: ${
                isActive ? "#059669" : "#64748b"
              }; border: 2.5px solid white; border-radius: 9999px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 13px; overflow: hidden;">
                ${avatarContent}
              </div>
              <div style="position: absolute; -bottom: 2px; width: 8px; height: 8px; background: ${
                isActive ? "#10b981" : "#94a3b8"
              }; border-radius: 9999px; border: 1.5px solid white;"></div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
          markerRef.current.setIcon(customIcon);
        } else {
          markerRef.current = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        }

        if (accuracy && accuracy > 0 && isActive) {
          if (circleRef.current) {
            circleRef.current.setLatLng([latitude, longitude]);
            circleRef.current.setRadius(accuracy);
          } else {
            circleRef.current = L.circle([latitude, longitude], {
              radius: accuracy,
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 0.14,
              weight: 1,
            }).addTo(map);
          }
        } else if (circleRef.current) {
          circleRef.current.remove();
          circleRef.current = null;
        }

        map.setView([latitude, longitude], 15);
      })
      .catch(() => {
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
  }, [latitude, longitude, accuracy, displayName, avatarUrl, isActive]);

  if (mapError) {
    return (
      <div
        onClick={onClick}
        className="w-full h-36 rounded-2xl bg-slate-100 dark:bg-[#15201b] border border-slate-200 dark:border-emerald-950 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:opacity-95"
      >
        <Compass className="w-6 h-6 text-emerald-600 animate-pulse mb-1" />
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {isActive ? "Live GPS Location" : "Location Pin"}
        </span>
        <span className="text-[10px] text-slate-500 font-mono mt-0.5">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-emerald-900/40 cursor-pointer group shadow-xs"
      title="Tap to expand full live tracking map"
    >
      <div ref={mapContainerRef} className="w-full h-full pointer-events-none" />

      {/* Tap Overlay Button */}
      <div className="absolute inset-0 bg-black/5 hover:bg-black/10 transition-colors flex items-end justify-end p-2 pointer-events-auto">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/90 dark:bg-black/80 backdrop-blur-md text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200/60 dark:border-emerald-950/60 group-hover:scale-105 transition-transform">
          <ExternalLink className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Expand Map</span>
        </span>
      </div>
    </div>
  );
};
