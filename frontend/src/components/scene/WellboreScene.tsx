"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CameraBookmark, Overlay3DMode, WellState } from "../../data/types";
import { useSceneStore } from "../../state/useSceneStore";
import { Wellbore2DFallback } from "./Wellbore2DFallback";
import { Layers, Camera, Scissors, RotateCw, AlertTriangle } from "lucide-react";

interface WellboreSceneProps {
  wellState: WellState;
  interactive?: boolean;
  autoRotate?: boolean;
  height?: number | string;
  onSelectNode?: (nodeId: string) => void;
}

export function WellboreScene({
  wellState,
  interactive = true,
  autoRotate = false,
  height = "100%",
  onSelectNode,
}: WellboreSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { overlayMode, cameraBookmark, isCrossSection, setOverlayMode, setCameraBookmark, toggleCrossSection } =
    useSceneStore();

  const [webGlSupported, setWebGlSupported] = useState<boolean | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  // Screen reader announcement for a11y (§11.6)
  const [a11yAnnouncement, setA11yAnnouncement] = useState("");

  useEffect(() => {
    // Check WebGL support safely on client
    try {
      if (typeof window === "undefined") return;
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setWebGlSupported(!!gl);
    } catch {
      setWebGlSupported(false);
      setShowFallback(true);
    }
  }, []);

  useEffect(() => {
    if (!wellState) return;
    setA11yAnnouncement(
      `3D Wellbore in ${overlayMode} overlay mode. Bottomhole temperature ${wellState.inferred.bottomholeTempC.value}°C, viscosity ${wellState.inferred.viscosityCp.value} cP, rod floating risk ${wellState.rodFloatingRiskPct}%.`
    );
  }, [overlayMode, wellState]);

  useEffect(() => {
    if (!containerRef.current || !webGlSupported || showFallback || !wellState) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const heightPx = container.clientHeight || 450;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) {
      console.warn("WebGL Renderer initialization failed, falling back to 2D Schematic", e);
      setShowFallback(true);
      return;
    }

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0C0F12");

    const camera = new THREE.PerspectiveCamera(45, width / Math.max(1, heightPx), 0.1, 1000);
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
    renderer.localClippingEnabled = true;

    const domElement = renderer.domElement;
    container.appendChild(domElement);

    // Clipping plane for cross-section mode (§11.4)
    const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    const clippingPlanes = isCrossSection ? [clipPlane] : [];

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(15, 25, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00b4a0, 0.8);
    dirLight2.position.set(-15, -10, -10);
    scene.add(dirLight2);

    // Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Color choices based on overlay mode (§11.3)
    let rodColor = 0x00b4a0;
    let wellboreColor = 0x5a6572;
    let reservoirColor = 0xc65b32;

    if (overlayMode === "temperature") {
      const tNorm = Math.min(1, (wellState.inferred.bottomholeTempC.value - 35) / 160);
      reservoirColor = new THREE.Color().setHSL(0.08 - tNorm * 0.08, 0.9, 0.55).getHex();
      wellboreColor = reservoirColor;
    } else if (overlayMode === "rod_risk") {
      if (wellState.rodFloatingRiskPct > 60) rodColor = 0xc43d35;
      else if (wellState.rodFloatingRiskPct > 35) rodColor = 0xb77a08;
      else rodColor = 0x238b57;
    } else if (overlayMode === "drag") {
      rodColor = 0xc65b32;
    }

    // 1. Surface Pad & Ground Plane
    const groundGeo = new THREE.CylinderGeometry(8, 8, 0.4, 32);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a2028, roughness: 0.8 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = 0;
    groundMesh.name = "surface_pad";
    rootGroup.add(groundMesh);

    // 2. Procedural Pumping Unit (Walking Beam, Samson Posts, Horsehead)
    const unitGroup = new THREE.Group();
    unitGroup.name = "pumping_unit";

    // Samson post
    const postGeo = new THREE.CylinderGeometry(0.15, 0.35, 3.5, 4);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5a6572 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(0, 1.75, 1.5);
    unitGroup.add(post);

    // Walking beam
    const beamGeo = new THREE.BoxGeometry(0.3, 0.4, 4.5);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0xc65b32 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 3.5, 0.8);
    unitGroup.add(beam);

    // Horsehead
    const horseGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16, 1, false, 0, Math.PI);
    const horseMat = new THREE.MeshStandardMaterial({ color: 0x00b4a0 });
    const horse = new THREE.Mesh(horseGeo, horseMat);
    horse.rotation.z = Math.PI / 2;
    horse.rotation.y = Math.PI / 2;
    horse.position.set(0, 3.5, -1.4);
    unitGroup.add(horse);

    rootGroup.add(unitGroup);

    // 3. Wellbore Casing (Outer) & Tubing (Inner)
    const totalWellDepth = 14; // Scaled scene units
    const casingGeo = new THREE.CylinderGeometry(0.5, 0.5, totalWellDepth, 24, 1, true);
    const casingMat = new THREE.MeshStandardMaterial({
      color: wellboreColor,
      roughness: 0.6,
      side: THREE.DoubleSide,
      clippingPlanes,
    });
    const casing = new THREE.Mesh(casingGeo, casingMat);
    casing.position.y = -totalWellDepth / 2;
    casing.name = "wellbore";
    rootGroup.add(casing);

    // 4. Rod String (Inside Tubing)
    const rodGeo = new THREE.CylinderGeometry(0.1, 0.1, totalWellDepth - 0.5, 16);
    const rodMat = new THREE.MeshStandardMaterial({
      color: rodColor,
      roughness: 0.4,
      metalness: 0.8,
      clippingPlanes,
    });
    const rodString = new THREE.Mesh(rodGeo, rodMat);
    rodString.position.y = -totalWellDepth / 2 + 0.2;
    rodString.name = "rod_string";
    rootGroup.add(rodString);

    // 5. Downhole Pump at Bottomhole
    const pumpGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16);
    const pumpMat = new THREE.MeshStandardMaterial({
      color: 0x238b57,
      metalness: 0.5,
      clippingPlanes,
    });
    const pump = new THREE.Mesh(pumpGeo, pumpMat);
    pump.position.y = -totalWellDepth + 0.8;
    pump.name = "downhole_pump";
    rootGroup.add(pump);

    // 6. Formation Reservoir Slab
    const slabGeo = new THREE.CylinderGeometry(6, 6, 1.5, 32);
    const slabMat = new THREE.MeshStandardMaterial({
      color: reservoirColor,
      transparent: true,
      opacity: 0.45,
      roughness: 0.7,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = -totalWellDepth + 0.5;
    slab.name = "reservoir_slab";
    rootGroup.add(slab);

    // 7. Fluid Flow Particle Stream inside Tubing
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = -Math.random() * totalWellDepth;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x00b4a0,
      size: 0.12,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    rootGroup.add(particles);

    // 8. 3D Depth Ruler / Rail (§11.2)
    const rulerGroup = new THREE.Group();
    rulerGroup.position.set(-1.8, 0, 0);

    const rulerLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -totalWellDepth, 0),
    ]);
    const rulerLineMat = new THREE.LineBasicMaterial({ color: 0x5a6572 });
    const rulerLine = new THREE.Line(rulerLineGeo, rulerLineMat);
    rulerGroup.add(rulerLine);

    // Tick marks
    for (let d = 0; d <= totalWellDepth; d += 2) {
      const tickGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.2, -d, 0),
        new THREE.Vector3(0.2, -d, 0),
      ]);
      const tick = new THREE.Line(tickGeo, rulerLineMat);
      rulerGroup.add(tick);
    }
    rootGroup.add(rulerGroup);

    // Set initial camera bookmark
    const applyCameraBookmark = (bookmark: CameraBookmark) => {
      switch (bookmark) {
        case "surface":
          camera.position.set(0, 5, 8);
          camera.lookAt(0, 2, 0);
          break;
        case "downhole":
          camera.position.set(0, -totalWellDepth + 2, 6);
          camera.lookAt(0, -totalWellDepth + 1, 0);
          break;
        case "cross_section":
          camera.position.set(8, -totalWellDepth / 2, 10);
          camera.lookAt(0, -totalWellDepth / 2, 0);
          break;
        case "full":
        default:
          camera.position.set(10, -totalWellDepth / 3, 16);
          camera.lookAt(0, -totalWellDepth / 2, 0);
          break;
      }
    };
    applyCameraBookmark(cameraBookmark);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const spm = wellState.observed.spm || 5.2;
    const cycleFreq = (spm / 60) * 2 * Math.PI;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Reciprocating beam and rod motion
      const reciprocation = Math.sin(elapsedTime * cycleFreq);
      beam.rotation.x = reciprocation * 0.15;
      rodString.position.y = -totalWellDepth / 2 + reciprocation * 0.35;

      // Fluid particle ascent
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const speed = (wellState.observed.flowBopd / 800) * 0.08 + 0.02;

      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] += speed;
        if (posArray[i * 3 + 1] > 0) {
          posArray[i * 3 + 1] = -totalWellDepth;
        }
      }
      posAttr.needsUpdate = true;

      // Auto rotate if enabled
      if (autoRotate) {
        rootGroup.rotation.y += 0.005;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Mouse Interaction / Orbit Drag
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      // Raycast click detection for component dossier
      if (onSelectNode) {
        const rect = domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(rootGroup.children, true);
        if (intersects.length > 0) {
          let node = intersects[0].object;
          while (node && !node.name && node.parent) {
            node = node.parent as THREE.Mesh;
          }
          if (node && node.name) {
            onSelectNode(node.name);
          }
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !interactive) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      rootGroup.rotation.y += deltaX * 0.01;
      camera.position.y += deltaY * 0.03;
      camera.position.y = Math.max(-totalWellDepth - 2, Math.min(8, camera.position.y));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      camera.position.z += e.deltaY * 0.015;
      camera.position.z = Math.max(5, Math.min(30, camera.position.z));
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("wheel", onWheel);
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      renderer.dispose();
    };
  }, [wellState, overlayMode, cameraBookmark, isCrossSection, interactive, autoRotate, webGlSupported, showFallback, onSelectNode]);

  if (showFallback || webGlSupported === false) {
    return (
      <Wellbore2DFallback
        wellState={wellState}
        onTry3d={() => setShowFallback(false)}
      />
    );
  }

  return (
    <div className="relative w-full h-full min-h-[420px] bg-surface-0 rounded-lg border border-line overflow-hidden select-none flex flex-col justify-between">
      {/* Screen reader live region for accessibility (§11.6) */}
      <div className="sr-only" aria-live="polite">
        {a11yAnnouncement}
      </div>

      {/* Top Controls Overlay: Mode Selector & Bookmarks */}
      {interactive && (
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-none">
          {/* Overlay Mode Selector Pills */}
          <div className="flex items-center gap-1 bg-surface-1/90 backdrop-blur-md p-1 rounded-lg border border-line shadow-card pointer-events-auto overflow-x-auto max-w-full">
            {(
              [
                { id: "structure", label: "Structure" },
                { id: "temperature", label: "Temperature" },
                { id: "rod_risk", label: "Rod Risk" },
                { id: "drag", label: "Viscous Drag" },
                { id: "fluid_flow", label: "Fluid Flow" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setOverlayMode(m.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold transition-colors whitespace-nowrap ${
                  overlayMode === m.id
                    ? "bg-accent-mechanical text-surface-0 font-bold"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Camera Bookmarks & Cross Section Toggle */}
          <div className="flex items-center gap-1 bg-surface-1/90 backdrop-blur-md p-1 rounded-lg border border-line shadow-card pointer-events-auto">
            {(
              [
                { id: "surface", label: "Surface" },
                { id: "full", label: "Full Well" },
                { id: "downhole", label: "Pump" },
              ] as const
            ).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setCameraBookmark(b.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-sans transition-colors ${
                  cameraBookmark === b.id
                    ? "bg-surface-3 text-text-primary font-bold border border-line"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                }`}
              >
                {b.label}
              </button>
            ))}

            <button
              type="button"
              onClick={toggleCrossSection}
              className={`p-1 rounded text-[10px] font-sans flex items-center gap-1 border transition-colors ${
                isCrossSection
                  ? "bg-accent-thermal/20 text-accent-thermal border-accent-thermal/50 font-bold"
                  : "text-text-secondary border-transparent hover:text-text-primary"
              }`}
              title="Toggle Subsurface Internal Cross-Section Cut Plane"
            >
              <Scissors className="w-3 h-3" />
              <span>Cut</span>
            </button>
          </div>
        </div>
      )}

      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Bottom Telemetry HUD */}
      <div className="absolute bottom-3 left-3 right-3 bg-surface-1/90 backdrop-blur-md p-2.5 rounded-lg border border-line shadow-card flex items-center justify-between z-10 pointer-events-none text-xs font-mono">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-sans text-text-muted">BHT:</span>
            <span className="font-bold text-accent-thermal ml-1 tabular-nums">{wellState.inferred.bottomholeTempC.value.toFixed(1)}°C</span>
          </div>
          <div>
            <span className="text-[10px] font-sans text-text-muted">Viscosity:</span>
            <span className="font-bold text-accent-mechanical ml-1 tabular-nums">{wellState.inferred.viscosityCp.value.toLocaleString()} cP</span>
          </div>
          <div>
            <span className="text-[10px] font-sans text-text-muted">Rod Floating Risk:</span>
            <span className={`font-bold ml-1 tabular-nums ${wellState.rodFloatingRiskPct > 50 ? "text-status-warn" : "text-status-safe"}`}>
              {wellState.rodFloatingRiskPct}%
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[10px] font-sans text-text-muted">
          <span>Click components to inspect dossier · Drag to rotate · Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
