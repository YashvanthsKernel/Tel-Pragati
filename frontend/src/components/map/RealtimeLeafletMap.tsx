"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { WellSummary } from "../../data/types";
import { Layers, MapPin, Eye, Maximize2, Satellite, Navigation } from "lucide-react";

interface RealtimeLeafletMapProps {
  wells: WellSummary[];
  selectedWell: WellSummary | null;
  onSelectWell: (well: WellSummary) => void;
}

export function RealtimeLeafletMap({
  wells,
  selectedWell,
  onSelectWell,
}: RealtimeLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [mapType, setMapType] = useState<"esriDark" | "dark" | "positron" | "voyager" | "satellite" | "osm">("esriDark");
  const [isReady, setIsReady] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Center around Baghewala Field (Jaisalmer district, Rajasthan)
      const centerLat = 27.8145;
      const centerLon = 72.423;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLon],
          zoom: 14,
          zoomControl: false,
          attributionControl: false,
        });

        L.control.zoom({ position: "topleft" }).addTo(map);

        const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;
        // CARTO basemap CDN expects ?key=YOUR_BASEMAP_KEY
        const authParam = cartoKey ? `?key=${cartoKey}` : "";

        // Tile layer definitions
        const darkTiles = L.tileLayer(
          `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${authParam}`,
          { maxZoom: 19, subdomains: "abcd", attribution: "&copy; CARTO" }
        );

        const esriDarkBase = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16, attribution: "&copy; Esri" }
        );
        const esriDarkLabels = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16 }
        );
        const esriDarkGroup = L.layerGroup([esriDarkBase, esriDarkLabels]);

        const positronTiles = L.tileLayer(
          `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${authParam}`,
          { maxZoom: 19, subdomains: "abcd", attribution: "&copy; CARTO" }
        );

        const voyagerTiles = L.tileLayer(
          `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${authParam}`,
          { maxZoom: 19, subdomains: "abcd", attribution: "&copy; CARTO" }
        );

        const satTiles = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19, attribution: "&copy; Esri" }
        );

        const osmTiles = L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          { maxZoom: 19, attribution: "&copy; OpenStreetMap" }
        );

        // Default to clean SCADA dark
        esriDarkGroup.addTo(map);
        (map as any)._tileLayers = {
          dark: darkTiles,
          esriDark: esriDarkGroup,
          positron: positronTiles,
          voyager: voyagerTiles,
          satellite: satTiles,
          osm: osmTiles,
        };

        // PML Lease Boundary Polygon (~200 km² boundary in Jodhpur Sandstone)
        const pmlBoundaryCoords: [number, number][] = [
          [27.828, 72.405],
          [27.829, 72.445],
          [27.802, 72.448],
          [27.801, 72.408],
        ];

        const pmlPolygon = L.polygon(pmlBoundaryCoords, {
          color: "#C65B32",
          weight: 2,
          opacity: 0.8,
          dashArray: "6, 6",
          fillColor: "#C65B32",
          fillOpacity: 0.08,
        }).addTo(map);

        pmlPolygon.bindTooltip("Baghewala PML Lease Boundary (~200 km²)", {
          permanent: false,
          direction: "center",
          className: "leaflet-dark-tooltip",
        });

        mapInstanceRef.current = map;
        setIsReady(true);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when mapType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !(map as any)._tileLayers) return;

    const layers = (map as any)._tileLayers;
    Object.values(layers).forEach((layer: any) => map.removeLayer(layer));

    if (layers[mapType]) {
      layers[mapType].addTo(map);
    }
  }, [mapType]);

  // Update Well Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isReady || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      // Clear previous markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      wells.forEach((well) => {
        const isSelected = selectedWell?.wellId === well.wellId;
        const color =
          well.status === "producing"
            ? "#238B57"
            : well.status === "css_active"
            ? "#C65B32"
            : well.status === "alarm"
            ? "#C43D35"
            : "#74808B";

        // Custom HTML marker with animated pulsing ring
        const customIcon = L.divIcon({
          className: "custom-leaflet-marker",
          html: `
            <div class="relative flex items-center justify-center cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group">
              <div class="absolute w-8 h-8 rounded-full ${
                well.status === "alarm"
                  ? "bg-status-critical/40 animate-ping"
                  : isSelected
                  ? "bg-accent-mechanical/40 animate-pulse"
                  : "bg-transparent"
              }"></div>
              <div class="w-5 h-5 rounded-full border-2 ${
                isSelected ? "border-white scale-125" : "border-surface-0"
              } shadow-popup flex items-center justify-center transition-all" style="background-color: ${color}">
                <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>
              <div class="absolute top-6 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-popup border transition-all ${
                isSelected
                  ? "bg-surface-2 text-accent-mechanical border-accent-mechanical"
                  : "bg-surface-1/95 text-text-primary border-line"
              }">
                ${well.name}
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([well.lat, well.lon], { icon: customIcon }).addTo(map);

        // Interactive popup
        const popupContent = `
          <div style="font-family: var(--font-ibm-plex-mono); color: #20252B; background: #FFFFFF; padding: 8px; border-radius: 6px; border: 1px solid #D1D8DF; min-width: 180px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: #197F8C; font-size: 13px;">${well.name}</strong>
              <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: ${color}20; color: ${color}; font-weight: bold; text-transform: uppercase;">${well.status}</span>
            </div>
            <div style="font-size: 11px; margin-bottom: 3px;">Pad: <span style="color: #74808B;">${well.padId}</span></div>
            <div style="font-size: 11px; margin-bottom: 3px;">Gross Flow: <strong>${well.flowBopd} BOPD</strong></div>
            <div style="font-size: 11px; margin-bottom: 3px;">BHT: <span style="color: #C65B32;">${well.bhtCelsius || 74.2}°C</span></div>
            <div style="font-size: 11px; margin-bottom: 6px;">Health Index: <strong style="color: #238B57;">${well.healthPct}%</strong></div>
            <a href="/well/${well.wellId}/twin" style="display: block; text-align: center; background: #197F8C; color: #FFFFFF; font-weight: bold; font-size: 10px; padding: 4px 8px; border-radius: 4px; text-decoration: none; margin-top: 4px;">Open Full Digital Twin →</a>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: "leaflet-custom-popup",
          closeButton: false,
        });

        marker.on("click", () => {
          onSelectWell(well);
        });

        markersRef.current.set(well.wellId, marker);
      });
    });
  }, [wells, selectedWell, isReady, onSelectWell]);

  // Pan to selected well
  const handleRecenter = (well: WellSummary) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([well.lat, well.lon], 16, { duration: 1.2 });
    }
  };

  const hasCartoKey = !!process.env.NEXT_PUBLIC_CARTO_API_KEY;

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-lg bg-surface-0">
      {/* Top Map Layer Selector Overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 bg-surface-1/90 backdrop-blur-md p-1 rounded-md border border-line shadow-popup">
        {hasCartoKey && (
          <span className="px-2 py-0.5 mr-1 rounded bg-accent-mechanical/10 text-accent-mechanical border border-accent-mechanical/20 text-[9px] font-mono font-bold uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-mechanical animate-pulse" />
            CARTO Connected
          </span>
        )}

        <button
          type="button"
          onClick={() => setMapType("esriDark")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
            mapType === "esriDark"
              ? "bg-accent-mechanical text-surface-0"
              : "text-text-muted hover:text-text-primary"
          }`}
          title="Esri World Dark Canvas (Clean High-Contrast SCADA)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>SCADA Dark (Clean)</span>
        </button>

        <button
          type="button"
          onClick={() => setMapType("dark")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
            mapType === "dark"
              ? "bg-accent-mechanical text-surface-0"
              : "text-text-muted hover:text-text-primary"
          }`}
          title="CARTO Dark Matter"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>CARTO Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setMapType("positron")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
            mapType === "positron"
              ? "bg-accent-mechanical text-surface-0"
              : "text-text-muted hover:text-text-primary"
          }`}
          title="CARTO Positron Light"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>CARTO Light</span>
        </button>

        <button
          type="button"
          onClick={() => setMapType("voyager")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
            mapType === "voyager"
              ? "bg-accent-mechanical text-surface-0"
              : "text-text-muted hover:text-text-primary"
          }`}
          title="CARTO Voyager Detailed"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Voyager</span>
        </button>

        <button
          type="button"
          onClick={() => setMapType("satellite")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
            mapType === "satellite"
              ? "bg-accent-thermal text-surface-0"
              : "text-text-muted hover:text-text-primary"
          }`}
          title="ArcGIS Satellite Imagery"
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>

        <button
          type="button"
          onClick={() => setMapType("osm")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
            mapType === "osm"
              ? "bg-status-safe text-surface-0"
              : "text-text-muted hover:text-text-primary"
          }`}
          title="OpenStreetMap Standard"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Street</span>
        </button>
      </div>

      {/* Recenter & Telemetry HUD Overlay */}
      {selectedWell && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-surface-1/95 backdrop-blur-md p-2.5 rounded-md border border-line shadow-popup flex items-center gap-3 text-xs font-mono">
          <div>
            <span className="text-[10px] text-text-muted">Target Well:</span>
            <span className="font-bold text-accent-mechanical ml-1">{selectedWell.name}</span>
          </div>
          <div>
            <span className="text-[10px] text-text-muted">GPS:</span>
            <span className="font-bold text-text-primary ml-1">
              {selectedWell.lat.toFixed(4)}°N, {selectedWell.lon.toFixed(4)}°E
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleRecenter(selectedWell)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-2 hover:bg-line border border-line text-accent-thermal transition-colors text-[11px] font-bold"
          >
            <Navigation className="w-3 h-3" />
            <span>Fly To Well</span>
          </button>
        </div>
      )}

      {/* Main Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px] z-0" />
    </div>
  );
}
