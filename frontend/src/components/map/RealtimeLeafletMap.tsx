"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { WellSummary } from "../../data/types";
import { Layers, MapPin, Satellite, Mountain, Navigation, Compass } from "lucide-react";

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
  const [mapType, setMapType] = useState<"esriDark" | "satellite" | "esriLight" | "topo" | "osm">("esriDark");
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

        // ── 1. High-Contrast SCADA Dark (Esri Dark Canvas - 100% Free & No API Key) ──
        const esriDarkBase = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16, attribution: "&copy; Esri &mdash; SCADA Dark" }
        );
        const esriDarkLabels = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16 }
        );
        const esriDarkGroup = L.layerGroup([esriDarkBase, esriDarkLabels]);

        // ── 2. High-Res Satellite Imagery with Hybrid Overlay (Esri Imagery - Free) ──
        const satBase = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19, attribution: "&copy; Esri &mdash; Satellite" }
        );
        const satLabels = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19 }
        );
        const satGroup = L.layerGroup([satBase, satLabels]);

        // ── 3. High-Contrast Engineering Light (Esri Light Canvas - Free) ──
        const esriLightBase = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16, attribution: "&copy; Esri &mdash; Light Canvas" }
        );
        const esriLightLabels = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16 }
        );
        const esriLightGroup = L.layerGroup([esriLightBase, esriLightLabels]);

        // ── 4. Geological Topography / Elevation Terrain (Esri Topo - Free) ──
        const topoTiles = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19, attribution: "&copy; Esri &mdash; Topo" }
        );

        // ── 5. OpenStreetMap Standard Vector (OSM - Free) ──
        const osmTiles = L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }
        );

        // Default to SCADA Dark Group
        esriDarkGroup.addTo(map);
        (map as any)._tileLayers = {
          esriDark: esriDarkGroup,
          satellite: satGroup,
          esriLight: esriLightGroup,
          topo: topoTiles,
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
          opacity: 0.85,
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
                isSelected ? "border-white scale-125 ring-2 ring-accent-mechanical" : "border-surface-0"
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

        // Interactive SCADA popup
        const popupContent = `
          <div style="font-family: var(--font-inter), sans-serif; color: #F0F4F8; background: #13171C; padding: 10px; border-radius: 8px; border: 1px solid #232B36; min-width: 190px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px solid #232B36; padding-bottom: 4px;">
              <strong style="color: #00B4A0; font-size: 13px;">${well.name}</strong>
              <span style="font-size: 9px; font-family: var(--font-ibm-plex-mono); padding: 2px 6px; border-radius: 4px; background: ${color}25; color: ${color}; font-weight: bold; text-transform: uppercase; border: 1px solid ${color}40;">${well.status}</span>
            </div>
            <div style="font-size: 11px; margin-bottom: 3px; font-family: var(--font-ibm-plex-mono); color: #8F9CA9;">Pad: <span style="color: #F0F4F8;">${well.padId}</span></div>
            <div style="font-size: 11px; margin-bottom: 3px; font-family: var(--font-ibm-plex-mono); color: #8F9CA9;">Gross Flow: <strong style="color: #F0F4F8;">${well.flowBopd} BOPD</strong></div>
            <div style="font-size: 11px; margin-bottom: 3px; font-family: var(--font-ibm-plex-mono); color: #8F9CA9;">BHT: <span style="color: #C65B32; font-weight: bold;">${well.bhtCelsius || 74.2}°C</span></div>
            <div style="font-size: 11px; margin-bottom: 8px; font-family: var(--font-ibm-plex-mono); color: #8F9CA9;">Health Index: <strong style="color: #238B57;">${well.healthPct}%</strong></div>
            <a href="/well/${well.wellId}/twin" style="display: block; text-align: center; background: #00B4A0; color: #0C0F12; font-weight: 700; font-size: 11px; padding: 5px 8px; border-radius: 6px; text-decoration: none; transition: opacity 0.2s;">Open Digital Twin →</a>
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

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-lg bg-surface-0">
      {/* Top Map Layer Selector Overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 bg-surface-1/90 backdrop-blur-md p-1 rounded-lg border border-line shadow-card">
        <button
          type="button"
          onClick={() => setMapType("esriDark")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-sans font-semibold transition-colors ${
            mapType === "esriDark"
              ? "bg-accent-mechanical text-surface-0 font-bold"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
          }`}
          title="Esri World Dark Canvas (High-Contrast SCADA Dark)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>SCADA Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setMapType("satellite")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-sans font-semibold transition-colors ${
            mapType === "satellite"
              ? "bg-accent-thermal text-surface-0 font-bold"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
          }`}
          title="High-Resolution Satellite Imagery"
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>

        <button
          type="button"
          onClick={() => setMapType("topo")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-sans font-semibold transition-colors ${
            mapType === "topo"
              ? "bg-accent-mechanical text-surface-0 font-bold"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
          }`}
          title="Geological Elevation & Topography"
        >
          <Mountain className="w-3.5 h-3.5" />
          <span>Terrain Topo</span>
        </button>

        <button
          type="button"
          onClick={() => setMapType("esriLight")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-sans font-semibold transition-colors ${
            mapType === "esriLight"
              ? "bg-surface-3 text-text-primary font-bold border border-line"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
          }`}
          title="Engineering Light Canvas"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Light Canvas</span>
        </button>

        <button
          type="button"
          onClick={() => setMapType("osm")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-sans font-semibold transition-colors ${
            mapType === "osm"
              ? "bg-status-safe text-surface-0 font-bold"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
          }`}
          title="OpenStreetMap Standard Vector"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Street</span>
        </button>
      </div>

      {/* Recenter & Telemetry HUD Overlay */}
      {selectedWell && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-surface-1/95 backdrop-blur-md p-2.5 rounded-lg border border-line shadow-card flex items-center gap-3 text-xs font-mono">
          <div>
            <span className="text-[10px] font-sans text-text-muted">Target Well:</span>
            <span className="font-bold text-accent-mechanical ml-1">{selectedWell.name}</span>
          </div>
          <div>
            <span className="text-[10px] font-sans text-text-muted">GPS:</span>
            <span className="font-bold text-text-primary ml-1">
              {selectedWell.lat.toFixed(4)}°N, {selectedWell.lon.toFixed(4)}°E
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleRecenter(selectedWell)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 border border-line text-accent-thermal transition-colors text-xs font-sans font-semibold"
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
