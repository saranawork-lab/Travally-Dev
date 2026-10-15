"use client";

import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export interface TreasureItem {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string | null;
  title: string;
  hintRiddle: string;
  latitude: number;
  longitude: number;
  locationName: string;
  difficulty: string;
  clueImageUrl?: string | null;
  solversCount: number;
  solvedUserIds: string[];
  createdAt: string;
}

interface TreasureMapProps {
  treasures: TreasureItem[];
  selectedTreasure: TreasureItem | null;
  onSelectTreasure: (treasure: TreasureItem) => void;
  onMapClickCoordinates?: (lat: number, lng: number) => void;
  isPickingLocation?: boolean;
}

export const TreasureMap: React.FC<TreasureMapProps> = ({
  treasures,
  selectedTreasure,
  onSelectTreasure,
  onMapClickCoordinates,
  isPickingLocation = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L: any;
    let map: any;

    import("leaflet").then((leafletModule) => {
      L = leafletModule.default || leafletModule;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        // Center of India / default explorer vantage
        const initialLat = selectedTreasure ? selectedTreasure.latitude : 17.385;
        const initialLng = selectedTreasure ? selectedTreasure.longitude : 78.4867;

        map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: selectedTreasure ? 12 : 5,
          scrollWheelZoom: false,
        });

        // Add sleek OpenStreetMap CartoDB Positron / OSM tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        map.on("click", (e: any) => {
          if (onMapClickCoordinates) {
            onMapClickCoordinates(e.latlng.lat, e.latlng.lng);
          }
        });

        mapInstanceRef.current = map;
      } else {
        map = mapInstanceRef.current;
      }

      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Custom treasure marker icon
      const treasureIcon = L.divIcon({
        className: "custom-treasure-marker",
        html: `
          <div style="
            background: linear-gradient(135deg, #f59e0b, #ea580c);
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
            border: 2px solid white;
            box-shadow: 0 4px 14px rgba(245, 158, 11, 0.5);
            cursor: pointer;
            transform: scale(1);
            transition: transform 0.2s;
          ">
            🏴‍☠️
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      // Add pins for all treasures
      treasures.forEach((item) => {
        if (typeof item.latitude === "number" && typeof item.longitude === "number") {
          const marker = L.marker([item.latitude, item.longitude], { icon: treasureIcon })
            .addTo(map)
            .on("click", () => {
              onSelectTreasure(item);
              map.setView([item.latitude, item.longitude], 13, { animate: true });
            });

          marker.bindTooltip(`<b>${item.title}</b><br/><span style="font-size:11px; color:#f97316;">${item.locationName}</span>`, {
            direction: "top",
            offset: [0, -14],
          });

          markersRef.current.push(marker);
        }
      });
    });

    return () => {
      // Keep map alive or clean up on unmount
    };
  }, [treasures, onSelectTreasure, onMapClickCoordinates]);

  // Recenter when selectedTreasure changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedTreasure) {
      mapInstanceRef.current.setView([selectedTreasure.latitude, selectedTreasure.longitude], 13, {
        animate: true,
      });
    }
  }, [selectedTreasure]);

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] rounded-3xl overflow-hidden border border-slate-200 dark:border-emerald-950/80 shadow-md">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      {isPickingLocation && (
        <div className="absolute top-3 left-3 right-3 sm:left-auto sm:right-3 bg-amber-500/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg pointer-events-none z-10 flex items-center gap-1.5">
          <span>📍 Click on map to set drop coordinates</span>
        </div>
      )}
    </div>
  );
};
