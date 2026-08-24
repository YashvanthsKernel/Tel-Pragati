# Tempo_Twin: Digital Twin for Well-to-Surface Optimization
### Cyclic Steam Stimulation (CSS) + Sucker Rod Pump (SRP) Operations at Baghewala Heavy Oil Field

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.173-orange?style=flat-square&logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Target](https://img.shields.io/badge/Target-Oil%20India%20Limited%20(OIL)-red?style=flat-square)]()
[![Ministry](https://img.shields.io/badge/Ministry-MoPNG%20Govt%20of%20India-green?style=flat-square)]()

---

## 🎯 Overview

**Tempo_Twin** is a high-density, light-industrial Digital Twin platform engineered for **Oil India Limited (OIL)** under the **Ministry of Petroleum & Natural Gas (MoPNG), Government of India** (SIH 2026).

It solves the operational and reservoir engineering challenges of producing ultra-heavy crude ($16.4^\circ - 17.8^\circ\text{ API}$, up to $18,500\text{ cP}$) from the **Jodhpur Sandstone formation** in Rajasthan using Cyclic Steam Stimulation coupled with Sucker Rod Pumping.

---

## 🔄 The Closed-Loop Causal Physics Chain

The system models, estimates, and optimizes the synchronized causal chain in real-time:

$$\text{Reservoir Thermal State} \longrightarrow T_{\text{BHT}} \longrightarrow \mu(T) \longrightarrow F_{\text{drag}} \longrightarrow \text{Gibbs 1D Wave Rod Dynamics} \longrightarrow \text{Dynagraph Fillage} \longrightarrow \text{Rod Floating Risk} \longrightarrow \text{VFD Advisory Modulation}$$

---

## 🏗️ 3-Tier Decoupled Architecture

```
Physical / SCADA Sensors (Load Cells, RTDs, VFD Motor Power)
                     │
         Ingestion & Data Quality Gate (DEMO SYNTHETIC / REPLAY)
                     │
               ENGINE CORE
     ┌───────────────┼───────────────┐
Thermal Model    Rheology Model    1D Gibbs Wave Dynamic Solver
(Convective)     (Andrade/Vogel)   (Downhole Reconstructed Card)
     └───────────────┬───────────────┘
          Model Agreement Engine (Physics vs ML Surrogate)
                     │
          Dynamic Multi-Objective Optimizer & INR Economic Cut-Off
                     │
        Model Contract: TwinComputationResult
                     │
             TWIN STATE STORE (React 19 / SSR Safe)
                     │
     ┌───────────────┼───────────────┬───────────────┐
   /twin          /physics       /diagnostics    /simulator
 (3D Sectional) (Model Health)  (Failure Replay) (What-If Lab)
     │               │               │               │
   /optimizer      /control     Time Machine   Provenance
 (Pareto/INR)   (Interlocks)   (45-Day CSS)    (X-Ray & Data)
```

---

## 🚀 Key Features

### 1. State-Aware 3D Sectional Well Viewer (`/twin`)
- **Three.js** interactive 3D wellbore with reciprocating walking beam, horsehead, and polished rod oscillation.
- **7 Engineering Overlays**:
  - `STRUCTURE`: Transparent casing & tubing sectional cutaway.
  - `TEMPERATURE`: Heat colormap gradient from steam chamber to wellhead.
  - `PRESSURE`: Hydrostatic & frictional pressure depth gradients.
  - `VISCOSITY`: Non-Newtonian viscous boundary layer distribution.
  - `DRAG`: Annular wall shear stress on the 1,040m sucker rod string.
  - `RISK`: Compressive rod buckling and slackline hazard zone.
  - `FLOW`: Animated directional fluid flow particles from perforations to wellhead.

### 2. Physics vs ML Surrogate Model Agreement (`/physics`)
- First-principles thermal convective-diffusion model compared against a deep surrogate observer.
- Real-time **Model Agreement Indicator** (`94% HIGH AGREEMENT`).
- Subsystem Model Health Deck: Thermal ($94\%$), Wellbore ($91\%$), Rheology ($89\%$), and Overall ($93\%$).

### 3. Dynagraph Diagnostics & 6-Stage Failure Replay (`/diagnostics`)
- Surface Load Cell card vs Gibbs 1D Damped Wave Reconstructed Downhole Pump card with animated stroke dot.
- **6-Stage Guided Failure Replay**:
  1. *Thermal Decline* ($140^\circ\text{C} \rightarrow 74.2^\circ\text{C}$)
  2. *Viscosity Surge* ($220\text{ cP} \rightarrow 5,820\text{ cP}$)
  3. *Fluid Drag Surge* ($7,840\text{ lb}$, $43\%$ buoyant rod weight)
  4. *Downstroke Delay & Dynagraph Sag*
  5. *Rod-Floating & Buckling Hazard Alarm*
  6. *VFD Remediation* ($-17\%$ asymmetric downstroke deceleration restores positive tension)

### 4. What-If Scenario Lab (`/simulator`)
- Interactive parameter sliders for Steam Volume, Soak Duration, SPM, and VFD Downstroke Damping.
- Real-time comparison matrix displaying impact on BOPD, Lifting Power, Rod Risk, and **Net Economic Value in Indian Rupees (₹/day)**.

### 5. Multi-Objective Strategy Optimizer (`/optimizer`)
- Dynamic objective scoring for Strategy A (Max Production), Strategy B (Balanced VFD Damping), and Strategy C (Min Energy).
- Interactive **Pareto Frontier Plot** (Cost in ₹/day vs BOPD with Risk circle diameter).
- Model-driven **Economic CSS Cut-Off Analyzer** in INR (₹/day).

### 6. Supervisory Control Console (`/control`)
- `ADVISORY`, `SUPERVISED`, and `AUTOMATED` modes.
- Asymmetric downstroke velocity profile generator.
- **7 Industrial Hard Safety Interlocks Matrix** (SPM, Motor Current, PPRL, Min Tension, Wellhead Pressure, Confidence, SCADA Link).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **3D Visualization**: Three.js & OrbitControls
- **Charts & Dynagraphs**: Native SVG engineering coordinate plots & Plotly.js
- **State Management**: Native React 19 `useSyncExternalStore` (SSR-safe pub/sub engine)
- **Styling**: Tailwind CSS (OIL corporate red `#E31E24` + Government of India palette)
- **Icons**: Lucide React

---

## 📦 Getting Started Locally

```bash
# Clone the repository
git clone https://github.com/YashvanthsKernel/Tempo_Twin.git
cd Tempo_Twin

# Install dependencies
npm install

# Run the development server
npm run dev

# Open in browser
http://localhost:3000
```

---

## 🚢 Vercel Deployment

1. Push this repository to GitHub.
2. Import the project in [Vercel Dashboard](https://vercel.com/new).
3. Framework Preset: **Next.js**.
4. Click **Deploy**.

---

## 📄 License & Attribution

Developed for **Oil India Limited** & **Ministry of Petroleum & Natural Gas, Government of India** (SIH 2026).
