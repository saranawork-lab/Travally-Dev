"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Compass } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface LiveTrackingMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  displayName: string;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  latitude,
  longitude,
  accuracy,
  displayName,
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
            zoomControl: true,
          });

          // OpenStreetMap tile layer with error handling
          const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          });

          tileLayer.on("tileerror", () => {
            // Silently handle tile load issues without crashing UI
          });

          tileLayer.addTo(map);
          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        if (!map) return;

        // Custom pulsing emergency/safety pin
        const customIcon = L.divIcon({
          className: "custom-safety-pin",
          html: `
            <div style="position: relative; width: 36px; height: 36px;">
              <div style="position: absolute; inset: 0; background: rgba(16, 185, 129, 0.35); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; width: 36px; height: 36px; background: #059669; border: 3px solid white; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 13px;">
                ${displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        } else {
          markerRef.current = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        }

        // Update or create accuracy radius circle
        if (accuracy && accuracy > 0) {
          if (circleRef.current) {
            circleRef.current.setLatLng([latitude, longitude]);
            circleRef.current.setRadius(accuracy);
          } else {
            circleRef.current = L.circle([latitude, longitude], {
              radius: accuracy,
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 0.15,
              weight: 1.5,
            }).addTo(map);
          }
        }

        map.panTo([latitude, longitude]);
      })
      .catch((err) => {
        console.warn("Leaflet map initialization warning:", err);
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
  }, [latitude, longitude, accuracy, displayName]);

  if (mapError) {
    return (
      <div className="w-full h-48 rounded-2xl bg-slate-100 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border flex flex-col items-center justify-center p-4 text-center space-y-2">
        <Compass className="w-8 h-8 text-emerald-600 animate-pulse" />
        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
          Map Rendering Unavailable (GPS Fix Active)
        </span>
        <p className="text-[11px] text-slate-500 font-mono">
          Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)} {accuracy ? `(±${Math.round(accuracy)}m)` : ""}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 dark:border-dark-border z-0 shadow-sm"
    />
  );
};
