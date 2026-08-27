"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useTwinStore } from "../../store/useTwinStore";
import { View3DMode, WellNodeId } from "../../types/twin";
import {
  Activity,
  AlertTriangle,
  Atom,
  Droplets,
  Eye,
  Flame,
  Gauge,
  Layers,
  ShieldAlert,
  Wind,
} from "lucide-react";

export const Well3DSectionalViewer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const {
    twinState,
    selectedWellNode,
    setSelectedWellNode,
    view3DMode,
    setView3DMode,
  } = useTwinStore();

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 550;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f7fa); // Clean industrial light background

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, -18, 55);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 120;
    controls.minDistance = 10;
    controls.target.set(0, -20, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(20, 40, 30);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xd8dee6, 0.5);
    fillLight.position.set(-20, -10, -20);
    scene.add(fillLight);

    // Well Assembly Group
    const wellGroup = new THREE.Group();
    scene.add(wellGroup);

    // 1. Surface Ground Plane
    const groundGeo = new THREE.CylinderGeometry(14, 14, 0.6, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0;
    wellGroup.add(ground);

    // 2. Surface Pumping Unit (Walking Beam & Horsehead)
    const baseGeo = new THREE.BoxGeometry(4, 1.2, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const srpBase = new THREE.Mesh(baseGeo, baseMat);
    srpBase.position.set(0, 0.8, -2);
    wellGroup.add(srpBase);

    const samsonPostGeo = new THREE.CylinderGeometry(0.3, 0.6, 6, 8);
    const samsonPostMat = new THREE.MeshStandardMaterial({ color: 0x2b2a29 });
    const post = new THREE.Mesh(samsonPostGeo, samsonPostMat);
    post.position.set(0, 4, -2);
    wellGroup.add(post);

    const beamGeo = new THREE.BoxGeometry(1.2, 0.8, 10);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0xe31e24 }); // OIL Red Walking Beam
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 7, 0);
    wellGroup.add(beam);

    const horseheadGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 16, 1, false, 0, Math.PI);
    const horseheadMat = new THREE.MeshStandardMaterial({ color: 0x2b2a29 });
    const horsehead = new THREE.Mesh(horseheadGeo, horseheadMat);
    horsehead.rotation.z = Math.PI / 2;
    horsehead.position.set(0, 7, 4.5);
    wellGroup.add(horsehead);

    // 3. Wellhead BOP Stack
    const wellheadGeo = new THREE.CylinderGeometry(0.9, 1.1, 2.5, 16);
    const wellheadMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
    const wellhead = new THREE.Mesh(wellheadGeo, wellheadMat);
    wellhead.position.set(0, 1.3, 4.5);
    wellGroup.add(wellhead);

    // 4. Wellbore Casing (Cutaway)
    const casingLength = 42;
    const casingGeo = new THREE.CylinderGeometry(2.4, 2.4, casingLength, 24, 1, true, 0, Math.PI * 1.5);
    let casingColor = 0x94a3b8;
    if (view3DMode === "PRESSURE") casingColor = 0x3b82f6;

    const casingMat = new THREE.MeshStandardMaterial({
      color: casingColor,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const casing = new THREE.Mesh(casingGeo, casingMat);
    casing.position.set(0, -casingLength / 2, 4.5);
    wellGroup.add(casing);

    // 5. Production Tubing Cutaway
    const tubingGeo = new THREE.CylinderGeometry(1.3, 1.3, casingLength - 2, 24, 1, true, 0, Math.PI * 1.5);
    let tubingColor = 0x64748b;
    if (view3DMode === "VISCOSITY") tubingColor = 0x6366f1;
    if (view3DMode === "FLOW") tubingColor = 0x0ea5e9;

    const tubingMat = new THREE.MeshStandardMaterial({
      color: tubingColor,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const tubing = new THREE.Mesh(tubingGeo, tubingMat);
    tubing.position.set(0, -casingLength / 2 + 1, 4.5);
    wellGroup.add(tubing);

    // 6. Sucker Rod String (Color-coded by active View3DMode)
    const rodGeo = new THREE.CylinderGeometry(0.22, 0.22, casingLength - 4, 16);
    let rodColor = 0x15803d; // Green nominal tension

    if (view3DMode === "RISK") {
      rodColor = twinState.rodFloatingRiskPercent > 60 ? 0xe31e24 : twinState.rodFloatingRiskPercent > 40 ? 0xd97706 : 0x15803d;
    } else if (view3DMode === "DRAG") {
      rodColor = 0xd97706;
    } else if (view3DMode === "TEMPERATURE") {
      rodColor = 0xf97316;
    } else if (view3DMode === "PRESSURE") {
      rodColor = 0x2563eb;
    } else if (view3DMode === "VISCOSITY") {
      rodColor = 0x4f46e5;
    }

    const rodMat = new THREE.MeshStandardMaterial({
      color: rodColor,
      metalness: 0.7,
      roughness: 0.3,
    });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(0, -casingLength / 2 + 2, 4.5);
    wellGroup.add(rod);

    // 7. Downhole Sucker Rod Pump (SRP Plunger & Barrel)
    const pumpBarrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 4.5, 16);
    const pumpBarrelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const pump = new THREE.Mesh(pumpBarrelGeo, pumpBarrelMat);
    pump.position.set(0, -casingLength + 2.5, 4.5);
    wellGroup.add(pump);

    // 8. Reservoir Formation & Thermal Steam Chamber
    const reservoirGeo = new THREE.CylinderGeometry(7.5, 7.5, 9, 32);
    const tempRatio = Math.max(0, Math.min(1, (twinState.bottomholeTemperatureC - 35) / (195 - 35)));
    
    let resColor = new THREE.Color().lerpColors(
      new THREE.Color(0x334155), // cold reservoir slate
      new THREE.Color(0xe31e24), // hot steam red
      tempRatio
    );

    if (view3DMode === "PRESSURE") resColor = new THREE.Color(0x1e40af);
    if (view3DMode === "VISCOSITY") resColor = new THREE.Color(0x4338ca);
    if (view3DMode === "FLOW") resColor = new THREE.Color(0x0284c7);

    const reservoirMat = new THREE.MeshStandardMaterial({
      color: resColor,
      transparent: true,
      opacity: 0.45,
      roughness: 0.8,
    });
    const reservoir = new THREE.Mesh(reservoirGeo, reservoirMat);
    reservoir.position.set(0, -casingLength - 1, 4.5);
    wellGroup.add(reservoir);

    // Perforations
    for (let i = 0; i < 16; i++) {
      const perfGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const perfMat = new THREE.MeshBasicMaterial({ color: 0xff9933 });
      const perf = new THREE.Mesh(perfGeo, perfMat);
      const angle = (i / 16) * Math.PI * 2;
      perf.position.set(Math.cos(angle) * 2.2, -casingLength + (i % 4) * 1.5 - 2, 4.5 + Math.sin(angle) * 2.2);
      wellGroup.add(perf);
    }

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const strokeFreq = (twinState.spm / 60) * Math.PI * 2;

      // Reciprocating beam rocking motion
      const beamAngle = Math.sin(elapsedTime * strokeFreq) * 0.12;
      beam.rotation.x = beamAngle;
      horsehead.rotation.z = Math.PI / 2 + beamAngle;

      // Polished rod vertical oscillation
      const rodOscillation = Math.sin(elapsedTime * strokeFreq) * 1.8;
      rod.position.y = -casingLength / 2 + 2 + rodOscillation;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [twinState, view3DMode]);

  const viewModes: { id: View3DMode; label: string; icon: React.ReactNode }[] = [
    { id: "STRUCTURE", label: "Structure", icon: <Layers className="w-3 h-3" /> },
    { id: "TEMPERATURE", label: "Temp (°C)", icon: <Flame className="w-3 h-3 text-oil-red" /> },
    { id: "PRESSURE", label: "Pressure", icon: <Gauge className="w-3 h-3 text-blue-600" /> },
    { id: "VISCOSITY", label: "Viscosity", icon: <Droplets className="w-3 h-3 text-indigo-600" /> },
    { id: "DRAG", label: "Drag (lb)", icon: <Wind className="w-3 h-3 text-amber-600" /> },
    { id: "RISK", label: "Rod Risk", icon: <ShieldAlert className="w-3 h-3 text-red-600" /> },
    { id: "FLOW", label: "Fluid Flow", icon: <Activity className="w-3 h-3 text-cyan-600" /> },
  ];

  return (
    <div className="relative w-full h-[540px] bg-surface rounded-md border border-app-border overflow-hidden flex flex-col select-none">
      {/* 3D Canvas Viewport */}
      <div ref={mountRef} className="w-full flex-1 relative cursor-grab active:cursor-grabbing" />

      {/* Top Left: Subsystem Node Selection */}
      <div className="absolute top-3 left-3 bg-surface/90 backdrop-blur-md p-1.5 rounded border border-app-border shadow-sm flex flex-col gap-1 z-10 text-[11px] font-mono">
        <span className="text-[10px] text-text-secondary px-1 font-bold uppercase">
          Select Well Subsystem:
        </span>
        <div className="grid grid-cols-2 gap-1">
          {[
            { id: "reservoir", label: "Reservoir (1040m)" },
            { id: "downhole_pump", label: "SRP Pump" },
            { id: "rod_string", label: "Rod String (7/8\")" },
            { id: "tubing", label: "Tubing (2-7/8\")" },
            { id: "wellhead", label: "Wellhead BOP" },
            { id: "surface_unit", label: "Pumping Unit" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedWellNode(item.id as WellNodeId)}
              className={`px-2 py-0.5 rounded text-left transition-colors ${
                selectedWellNode === item.id
                  ? "bg-oil-charcoal text-white font-bold"
                  : "bg-surface-alt hover:bg-slate-200 text-text-primary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Right: State-Aware 3D Visualization Modes */}
      <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-md p-1.5 rounded border border-app-border shadow-sm z-10 text-xs font-mono max-w-[200px]">
        <span className="text-[10px] text-text-secondary px-1 font-bold uppercase block mb-1">
          3D Engineering Mode:
        </span>
        <div className="grid grid-cols-1 gap-0.5">
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setView3DMode(mode.id)}
              className={`px-2 py-0.5 rounded flex items-center justify-between text-[11px] transition-colors ${
                view3DMode === mode.id
                  ? "bg-oil-red text-white font-bold"
                  : "hover:bg-slate-100 text-text-primary"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {mode.icon}
                <span>{mode.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Overlay: Depth Axis Ticks & Scale */}
      <div className="p-2.5 bg-surface-alt/95 border-t border-app-border flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-3 text-text-secondary">
          <span className="font-bold text-text-primary">DEPTH:</span>
          <span>0m</span>
          <span>•</span>
          <span>400m</span>
          <span>•</span>
          <span>800m</span>
          <span>•</span>
          <span className="font-bold text-oil-red">{twinState.depthMeters}m (Jodhpur Sandstone)</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-secondary font-semibold">MODE:</span>
          <span className="font-bold text-text-primary px-1.5 py-0.5 bg-surface border border-slate-300 rounded uppercase">
            {view3DMode}
          </span>
        </div>
      </div>
    </div>
  );
};
