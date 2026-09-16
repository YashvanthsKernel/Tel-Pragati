# Baghewala Digital Twin — Frontend Build Spec (Coding Agent Edition)

**Companion to:** `Baghewala_Digital_Twin_Solution_Architecture.md` (§7–9, §16) and `Baghewala_Digital_Twin_AIML_Architecture.md`
**Audience:** A coding agent (Claude Code / Cursor) building or upgrading the frontend. This is a build spec, not a tutorial — every section gives exact contracts, not prose descriptions to interpret loosely.
**Current state:** A working demo shell exists at `tempo-twin-h8se.vercel.app` with 6 pages (`/twin`, `/physics`, `/diagnostics`, `/simulator`, `/optimizer`, `/control`), single-well (BGW-08), hard-coded scenario data. This spec upgrades that into a multi-well, production-shaped application with a real data layer, a fleet map, and a full 3D well visualization — while keeping everything that already works well (the Time Machine scenario player, the physics/ML agreement framing, the interlock matrix).
**How to use this doc:** Build in the phase order in Section 16. Each phase has a Definition of Done — do not start the next phase until the current one's DoD is met. Do not skip the data-layer phase (Phase 1) to "get to the pretty parts" — every page below is written assuming the abstraction in Section 5 exists first.

---

## Table of Contents

1. Product Objective & Success Criteria
2. Tech Stack (pinned)
3. Design System
4. Information Architecture / Full Sitemap
5. Data Layer Architecture (Demo/Live abstraction)
6. Canonical TypeScript Contracts
7. Global App Shell & Navigation
8. Chart & Visualization Taxonomy
9. Page Specs — Fleet Level
10. Page Specs — Well Level (existing 6, upgraded)
11. **3D Well Visualization — Dedicated Section**
12. Page Specs — Cross-Cutting
13. Component Library
14. State Management
15. Non-Functional Requirements (a11y, performance, responsive, testing)
16. Build Phases & Definition of Done
17. Folder Structure
18. Environment Configuration
19. Open Questions / Assumptions to Confirm

---

## 1. Product Objective & Success Criteria

Build a **multi-well** operations frontend for OIL's Baghewala field that:
1. Gives one-click navigation to every page from anywhere in the app (persistent shell, no dead ends).
2. Shows the **whole field** (fleet map, fleet KPIs) as the landing experience, then lets the operator drill into any single well's full twin (the existing 6 pages, now parameterized by `well_id` instead of hard-coded).
3. Renders a genuine, data-bound **3D model of the wellbore** — not a decorative animation — as its own dedicated, deep-linkable experience.
4. Works identically whether it's fed by the synthetic Demo data provider or a real backend, via one data-layer abstraction, switchable at runtime.
5. Reads as a serious industrial control-room product (SCADA/HMI lineage), not a generic SaaS dashboard template or an AI-generated landing page.

**Definition of "production ready" for this spec:** typed end-to-end, no page in a broken/blank state on slow or missing data, responsive down to a tablet (this is a control-room + field-tablet product, not a phone-first consumer app — see §15.3), keyboard-navigable, automated tests on critical flows, and a real loading/error/empty state for every data-driven component (never a silent blank div).

---

## 2. Tech Stack (pinned)

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 14+, App Router, TypeScript strict mode | If the existing app is on a different generator (e.g., Vite-based), migrate — App Router's layouts are what make the persistent shell (§7) clean |
| Styling | Tailwind CSS + CSS variables for design tokens (§3) | No inline magic-number colors anywhere in components |
| UI primitives | shadcn/ui (Radix-based) | Accessible dialog/dropdown/tooltip/tabs primitives out of the box |
| 2D charts | **Recharts** (time series, bar, area, radar, treemap, scatter) | Primary chart library |
| Custom/complex charts | **D3.js** (v7) for anything Recharts can't express cleanly: dynamometer card overlay, Sankey, calendar heatmap, waterfall | Use D3 for *math + shape*, render into SVG via React, don't let D3 touch the DOM directly (no `d3.select` on live React nodes) |
| Geographic map | **MapLibre GL JS** + `react-map-gl` wrapper | Open-source, no vendor API key required, self-hostable tiles for an eventual air-gapped/on-prem OIL deployment |
| Schematic/plant map | Custom SVG canvas + `react-zoom-pan-pinch` | Not a map library — a hand-built site diagram, see §9.2 |
| 3D | **@react-three/fiber** + **@react-three/drei** + **@react-three/postprocessing** + **three.js** | See §11 in full |
| State — server data | **TanStack Query (React Query)** | All data-layer reads go through hooks, never raw `fetch` in components |
| State — client/UI | **Zustand** | Data-mode toggle, selected well, 3D scene state, sidebar collapse, autonomy-tier UI state |
| Forms | React Hook Form + Zod | Simulator "what-if" inputs, Admin threshold editor |
| Real-time | Native WebSocket client wrapped in a small typed hook (`useLiveSocket`) | Falls back to polling in Demo mode (§5) |
| Animation | Framer Motion, used deliberately (§3) — not on every element | Page transitions, alert entrances, gauge needle motion |
| Testing | Vitest + React Testing Library (unit/component), Playwright (e2e), `@react-three/test-renderer` or headless-gl smoke test for the 3D scene | See §15.4 |
| Deployment | Vercel (unchanged) | Preview deployments per PR |

---

## 3. Design System

Per the frontend-design discipline: this is a national energy-infrastructure product for a PSU (Oil India Limited), operated in control rooms and field tablets — the aesthetic should read like **precision instrumentation**, not a consumer dashboard template. Explicitly avoid the generic-AI defaults: no cream-background/serif/terracotta, no near-black/single-neon-accent-with-nothing-else, no broadsheet hairline-rules layout. This product's own world — steam, depth, thermal gradients, brass/steel gauges, seismic/wireline plots — is where the distinctive choices should come from.

### 3.1 Token system

**Color** (dark-first — this is a 24/7 monitoring surface, dark mode is the primary mode, not an afterthought):
| Token                    | Hex       | Use                                                                              |
| ------------------------ | --------- | -------------------------------------------------------------------------------- |
| `--surface-0`            | `#F3F5F7` | App background — cool industrial grey, reduces glare while keeping high contrast |
| `--surface-1`            | `#FFFFFF` | Primary cards, panels, charts, and engineering canvases                          |
| `--surface-2`            | `#EEF2F5` | Recessed panels, control groups, input areas                                     |
| `--surface-3`            | `#E4E9EE` | Hover states, selected controls, secondary surfaces                              |
| `--line`                 | `#D1D8DF` | Standard borders, chart grids, separators                                        |
| `--line-strong`          | `#AEB8C2` | Strong boundaries, active engineering outlines                                   |
| `--text-primary`         | `#20252B` | Primary headings, numerical values, engineering labels                           |
| `--text-secondary`       | `#46515C` | Supporting labels, descriptions, annotations                                     |
| `--text-muted`           | `#74808B` | Units, timestamps, secondary metadata                                            |
| `--text-disabled`        | `#AAB3BB` | Disabled controls and unavailable information                                    |
| `--oil-red`              | `#E31E24` | Oil India brand identity, primary actions, high-priority emphasis                |
| `--oil-red-soft`         | `#FDEBEC` | Soft OIL-red backgrounds, selected critical panels                               |
| `--oil-charcoal`         | `#2B2A29` | Engineering headers, navigation structure, major typography                      |
| `--accent-thermal`       | `#C65B32` | CSS/steam/thermal domain — steam injection, heating, temperature                 |
| `--thermal-hot`          | `#D9472E` | High thermal intensity in gradients and 3D visualization                         |
| `--thermal-mid`          | `#E58A3A` | Intermediate thermal intensity                                                   |
| `--thermal-warm`         | `#F0C27A` | Lower thermal intensity / cooling boundary                                       |
| `--accent-mechanical`    | `#197F8C` | SRP, sucker-rod, pump, drag, mechanical state                                    |
| `--mechanical-soft`      | `#E1F2F4` | Mechanical information backgrounds and selected states                           |
| `--mechanical-dark`      | `#145E69` | Strong mechanical labels and emphasis                                            |
| `--accent-telemetry`     | `#2868A8` | Direct measured telemetry and field instrumentation                              |
| `--telemetry-soft`       | `#E8F1F9` | `[MEASURED]` badges, sensor-data backgrounds                                     |
| `--status-safe`          | `#238B57` | Nominal, healthy, within operating envelope                                      |
| `--status-safe-soft`     | `#E8F6EE` | Safe-state backgrounds                                                           |
| `--status-warn`          | `#B77A08` | Warning, approaching operating boundary                                          |
| `--status-warn-soft`     | `#FFF5DC` | Warning backgrounds                                                              |
| `--status-critical`      | `#C43D35` | Critical rod/pump risk, severe operational alarms                                |
| `--status-critical-soft` | `#FCEAE9` | Critical backgrounds                                                             |
| `--status-info`          | `#2868A8` | General informational state                                                      |
| `--status-info-soft`     | `#E8F1F9` | Informational backgrounds                                                        |
| `--provenance-measured`  | `#2868A8` | `[MEASURED]` direct physical telemetry                                           |
| `--provenance-estimated` | `#197F8C` | `[ESTIMATED]` state-estimated / inferred variables                               |
| `--provenance-predicted` | `#B77A08` | `[PREDICTED]` forward-looking model outputs                                      |
| `--provenance-simulated` | `#7650A5` | `[SIMULATED]` What-If and scenario outputs                                       |
| `--depth-gradient-start` | `#DCEBF1` | Shallow/cool region of the well                                                  |
| `--depth-gradient-mid`   | `#8DB7C3` | Intermediate depth                                                               |
| `--depth-gradient-warm`  | `#D58A58` | Increasing thermal influence                                                     |
| `--depth-gradient-end`   | `#87432E` | Deep/hot region near the thermal zone                                            |


**Rule:** `--accent-thermal` is reserved for CSS/steam/temperature data. `--accent-mechanical` is reserved for SRP/mechanical/ML-inferred data. Never swap them — this color discipline is itself a piece of information architecture (a user should learn "orange = thermal, teal = mechanical" within one session and have it hold everywhere, including the 3D view's material colors).

**Typography:**
| Role | Face | Notes |
|---|---|---|
| Display / page titles | **Space Grotesk** | Technical-grotesk character, distinct from default system sans, used with restraint (titles and section headers only) |
| Body | **Inter** | High legibility at small sizes for dense data panels |
| Data / telemetry / numeric readouts | **IBM Plex Mono** | Tabular figures, monospace for all live numeric values (temperatures, pressures, SPM) — reinforces "this is instrumentation, not marketing copy" and prevents digit-jitter as values update |

**Signature element:** the **depth rail** — a persistent vertical scale (0m → total well depth) that appears in the Twin page's subsurface panel and, at full fidelity, in the 3D view (§11). It's shaded with the thermal gradient token pair above and is the one motif that should feel unmistakably "this app" — reuse its exact visual language (tick marks, gradient, current-depth marker) everywhere depth is referenced, including chart y-axes for any depth-indexed plot.

**Motion:** used for exactly three things — (1) the Time Machine scrubber and any value it drives (numbers, gauge needles, 3D state) animate smoothly, never jump-cut; (2) new alerts slide in from the alert rail with a brief highlight flash, then settle; (3) page/route transitions use a short, consistent fade+slight-vertical-shift. Nothing else gets scroll-triggered or hover-triggered animation by default — this is a monitoring tool, not a marketing site, and extraneous motion reads as noise against real telemetry motion.

### 3.2 Layout grid
12-column grid, `max-width: 1920px` container (this is a control-room product, expect wide monitors), with a persistent 72px collapsed / 240px expanded left sidebar (§7) and a 56px top bar. Card gutters: 16px. Never let a chart or gauge card go edge-to-edge without at least 16px internal padding — dense data still needs breathing room to stay legible.

---

## 4. Information Architecture / Full Sitemap

```
/                              → redirect to /field (or /login if unauthenticated)
/login                         → auth
/field                         → Fleet Overview (landing) — §9.1
/field/map                     → Fleet Map, geographic + schematic — §9.2
/field/alerts                  → Cross-well Alerts & Events — §12.1
/field/reports                 → Analytics & Reports — §12.2
/field/compare                 → Well Comparison — §12.3
/admin                         → Admin/Settings (RBAC-gated) — §12.4

/well/[wellId]/twin            → Well Twin (default view when a well is selected) — §10.1
/well/[wellId]/physics         → §10.2
/well/[wellId]/diagnostics     → §10.3
/well/[wellId]/simulator       → §10.4
/well/[wellId]/optimizer       → §10.5
/well/[wellId]/control         → §10.6
/well/[wellId]/3d              → Dedicated 3D Well Visualization — §11
```

Every `/well/[wellId]/*` route shares one layout (`app/well/[wellId]/layout.tsx`) that resolves `wellId`, loads the well's current state once via the data layer, and provides it to all six/seven child pages via context — do not re-fetch well identity/metadata on every sub-page.

---

## 5. Data Layer Architecture (Demo/Live abstraction)

This is the most important architectural decision in this spec — build it first (Phase 1), and every page must consume data only through it.

### 5.1 The abstraction

```ts
// data/provider.ts — the contract every page depends on, never a concrete implementation
interface DigitalTwinDataProvider {
  getFleetSummary(): Promise<FleetSummary>;
  getWellState(wellId: string): Promise<WellState>;
  subscribeWellState(wellId: string, onUpdate: (s: WellState) => void): Unsubscribe;
  getTelemetryRange(wellId: string, metric: string, from: Date, to: Date): Promise<TelemetryPoint[]>;
  getDynamometerLatest(wellId: string): Promise<DynamometerCard>;
  simulate(wellId: string, params: SimulationParams): Promise<SimulationResult>;
  getOptimizerResult(wellId: string): Promise<OptimizerResult>;
  getRecommendations(wellId: string, status?: RecommendationStatus): Promise<Recommendation[]>;
  approveRecommendation(id: string): Promise<void>;
  rejectRecommendation(id: string, reason: string): Promise<void>;
  getInterlocks(wellId: string): Promise<InterlockStatus[]>;
  listScenarios(): Promise<Scenario[]>;
  playScenario(scenarioId: string, speed: 1 | 2 | 5): Unsubscribe; // drives subscribeWellState under the hood in demo mode
}
```

### 5.2 Two implementations, one interface

| Implementation | Behavior |
|---|---|
| `DemoDataProvider` | Generates deterministic time series client-side (or fetches pre-computed scenario fixtures — see §5.3), replays the 5 existing scenarios (Normal Ops D14, Cooling D25, Rod Floating D35, CSS Cut-off D41, Energy Min D18) plus fleet-level synthetic data for all wells not currently "featured." `simulate()`/`approveRecommendation()` mutate local in-memory state only. |
| `LiveDataProvider` | Calls the real backend per the REST/WebSocket contracts in the main architecture doc §16. `subscribeWellState` opens the `ws/wells/{well_id}/telemetry` channel. |

### 5.3 Demo data generation approach
Do **not** hand-author static JSON fixtures for every scenario from scratch — port the physics relationships already defined in the main architecture doc (§11: thermal decay, viscosity-temperature curve, rod mechanics) into a small client-side (or edge-function) generator module (`data/demo/physicsSim.ts`) so the demo data is physically consistent and the 3D view (§11) and the charts are always showing numbers that agree with each other, exactly like the real physics/ML fusion will. This also means the demo generator can be reused as the seed for actual backend synthetic data later — one physics module, two consumers.

### 5.4 Runtime toggle
- Global `useDataMode()` Zustand store: `{ mode: 'demo' | 'live', setMode }`.
- A `DataProviderContext` at the app root selects `DemoDataProvider` or `LiveDataProvider` based on this store and injects it; components never import a concrete provider directly, only `useDataProvider()`.
- Visible toggle in the top bar (§7.2): a labeled switch, not a hidden setting — the existing app's "DEMO MODE: Synthetic Telemetry" badge pattern is good UX, keep that visibility principle, just make it an actual functioning switch instead of a static label.
- Persist the choice in `localStorage`; default to `demo` on first load so the app is always demoable with zero backend dependency.
- If `live` is selected and the backend is unreachable, auto-fall-back to `demo` with a visible toast ("Backend unreachable — showing demo data") — never show a blank/broken app because live mode failed silently.

---

## 6. Canonical TypeScript Contracts

Mirror the backend's canonical schema exactly (main doc §10, §16; AI/ML doc §3) — do not invent parallel field names on the frontend.

```ts
interface WellState {
  wellId: string;
  cssCycle: number;
  day: number;
  phase: 'inject' | 'soak' | 'produce' | 'shut_in' | 'unknown';
  observed: {
    surfaceTempC: number;
    flowBopd: number;
    motorCurrentA: number;
    tankLevelPct: number;
  };
  inferred: {
    bottomholeTempC: EstimatedValue;
    viscosityCp: EstimatedValue;
    rodDragLb: EstimatedValue;
    downholeFillagePct: EstimatedValue;
  };
  fusion: { agreementPct: number; divergencePct: number; physicsValue: number; mlValue: number };
  rodFloatingRiskPct: number;
  healthPct: number;
  source: 'synthetic' | 'rig' | 'scada';
}

interface EstimatedValue {
  value: number;
  trendPctPerDay?: number;
  confidence: number; // 0–1
}

interface FleetSummary {
  fieldName: string;
  wells: WellSummary[];
  fieldKpis: { totalBopd: number; avgSorTrailing30d: number; activeAlerts: number; wellsInAlarm: number };
}

interface WellSummary {
  wellId: string;
  name: string;
  lat: number; lon: number;         // §9.2 geographic map
  padId: string;                     // §9.2 schematic map grouping
  status: 'producing' | 'shut_in' | 'css_active' | 'alarm';
  healthPct: number;
  flowBopd: number;
}

interface DynamometerCard {
  wellId: string;
  ts: string;
  surfaceTrace: { position: number; load: number }[];
  downholeTrace: { position: number; load: number }[];
  classification: 'normal' | 'rod_floating' | 'fluid_pound' | 'gas_interference' | 'traveling_valve_leak';
  confidence: number;
}

interface Recommendation {
  id: string;
  wellId: string;
  ts: string;
  actionType: string;
  proposedParams: Record<string, number>;
  expectedImpact: { energyPct: number; riskPct: number; valueInrDay: number };
  autonomyTier: 'advisory' | 'supervised' | 'automated';
  status: 'pending' | 'approved' | 'rejected' | 'dispatched' | 'expired';
  explanation: string;
}

interface InterlockStatus {
  name: string;
  currentValue: number;
  limit: number;
  unit: string;
  armed: boolean;
  tripped: boolean;
}

interface OptimizerResult {
  strategies: { name: string; label: string; productionBopd: number; energyKwhDay: number; rodRiskPct: number; costInrDay: number; netValueInrDay: number; recommended: boolean }[];
  paretoFrontier: { costInrDay: number; productionBopd: number; riskPct: number }[];
  economicCutoffDay: number;
}

type Role = 'viewer' | 'operator' | 'engineer' | 'admin';
```

---

## 7. Global App Shell & Navigation

### 7.1 Layout
```
┌───────────────────────────────────────────────────────────────┐
│ TOP BAR: field name · well switcher · data-mode toggle ·       │
│          alerts bell · autonomy-tier badge · user/role menu    │
├────────┬──────────────────────────────────────────────────────┤
│ SIDE   │                                                       │
│ BAR    │                  PAGE CONTENT                        │
│ (nav)  │                                                       │
│        │                                                       │
└────────┴──────────────────────────────────────────────────────┘
```

### 7.2 Top bar contents
- **Field name** — static, "Baghewala Field · Jodhpur Sandstone."
- **Well switcher** — searchable combobox, always visible; switching wells while on a `/well/[id]/*` page navigates to the same sub-page for the new well (i.e., switching wells from `/well/BGW-08/optimizer` goes to `/well/BGW-11/optimizer`, not back to the fleet landing).
- **Data-mode toggle** — per §5.4.
- **Alerts bell** — badge count of active fleet-wide alerts, opens a dropdown preview, links to `/field/alerts`.
- **Autonomy-tier badge** — shows current global tier (Advisory/Supervised/Automated) per main doc §14.1, color-coded (`--status-safe` for Advisory, `--status-warn` for Supervised, `--status-critical`-adjacent treatment for Automated to keep it visually "loud" — this tier should never look casual).
- **User/role menu** — shows current `Role`, logout.

### 7.3 Sidebar navigation — full page access
Two sections, always both visible (this directly satisfies "we need to get access for all the pages" — no page should be more than one click away):

```
FIELD
  ▸ Overview        /field
  ▸ Map              /field/map
  ▸ Alerts           /field/alerts
  ▸ Reports          /field/reports
  ▸ Compare Wells    /field/compare

WELL: [selected well name]
  ▸ Twin             /well/[id]/twin
  ▸ Physics          /well/[id]/physics
  ▸ Diagnostics      /well/[id]/diagnostics
  ▸ Simulator        /well/[id]/simulator
  ▸ Optimizer        /well/[id]/optimizer
  ▸ Control          /well/[id]/control
  ▸ 3D View          /well/[id]/3d

──────────
  ▸ Admin            /admin   (Engineer/Admin roles only)
```

### 7.4 Role-based visibility (RBAC on the frontend)

| Route/action | Viewer | Operator | Engineer | Admin |
|---|---|---|---|---|
| All read-only pages | ✅ | ✅ | ✅ | ✅ |
| Approve/reject recommendation | ❌ | ✅ | ✅ | ✅ |
| Run Simulator what-if | ❌ | ✅ | ✅ | ✅ |
| Edit interlock thresholds (Admin) | ❌ | ❌ | ✅ | ✅ |
| User management (Admin) | ❌ | ❌ | ❌ | ✅ |
| Model registry status view (Admin) | ❌ | ❌ | ✅ | ✅ |

Implement as a `<RoleGate roles={['operator','engineer','admin']}>` wrapper component — hide (not just disable) actions the current role can't perform, but always show read-only data to at least Viewer.

---

## 8. Chart & Visualization Taxonomy

Every chart type used anywhere in the app, mapped to its tech and its page(s) — build these as reusable components in `components/charts/`, never as one-off inline chart code per page.

| Chart type | Tech | Used on | Purpose |
|---|---|---|---|
| Time-series line/area with confidence band | Recharts `AreaChart` (band) + `LineChart` (mean) | Twin, Physics, Simulator | Temperature/viscosity/production trends, forecast bands |
| Multi-axis combo chart | Recharts `ComposedChart` | Physics | Temperature (left axis) + viscosity (right axis) over time on one plot |
| Radial gauge | Custom SVG component (`<RadialGauge>`) | Twin (health%, risk%), Control (confidence%) | Instant-read status, matches depth-rail visual language |
| Sparkline | Recharts `LineChart`, axes hidden | Fleet Overview well cards, Twin stat cards | Compact trend inside a small card |
| Scatter/bubble | Recharts `ScatterChart` (bubble size = risk%) | Optimizer | Pareto frontier: cost vs. production, bubble = failure risk |
| Dynamometer XY overlay | **Custom D3 + SVG** (`<DynamometerChart>`) | Diagnostics | Surface vs. reconstructed downhole card, two overlaid closed paths |
| Heatmap | D3 (`<FleetHealthHeatmap>`) | Fleet Overview / Reports | Wells (rows) × KPIs (columns) health matrix |
| Radar/spider | Recharts `RadarChart` | Well Comparison | Multi-KPI comparison across 2–3 wells |
| Waterfall | Custom D3/SVG (`<EconomicWaterfall>`) | Optimizer | Gross revenue → lifting cost → thermal cost → net value |
| Sankey | D3-sankey (`<FlowSankey>`) | Physics or Reports (stretch) | Well-to-surface energy/fluid flow: steam in → thermal loss → lift energy → production out |
| Treemap | Recharts `Treemap` | Fleet Overview | Field production breakdown by well |
| Calendar heatmap | Custom D3 (`<CycleCalendar>`) | Reports | CSS cycle history / maintenance events over the year |
| Timeline/Gantt | Custom SVG (`<PhaseTimeline>`) | Twin (CSS phase bar), Reports | Inject/soak/produce phase blocks over the cycle |
| Donut | Recharts `PieChart` | Fleet Overview | Well status distribution (producing/shut-in/alarm) |
| Geographic map | MapLibre GL | Fleet Map | §9.2 |
| Schematic site diagram | Custom SVG | Fleet Map | §9.2 |
| 3D wellbore | React Three Fiber | 3D View | §11 |

**Shared chart conventions (apply to every chart above):**
- Every chart component accepts `isLoading`, `error`, and `data` as explicit props with dedicated skeleton/error-state rendering — no chart silently renders empty axes on missing data.
- Tooltips use `IBM Plex Mono` for numeric values (per §3.1).
- Thermal-domain series always use `--accent-thermal`; mechanical/SRP-domain series always use `--accent-mechanical`; this must hold across every chart type in the table, not just the obvious ones.

---

## 9. Page Specs — Fleet Level

### 9.1 Fleet Overview (`/field`) — the new landing page

**Purpose:** answer "how is the whole field doing right now, and where do I need to look?" in under 5 seconds.

**Layout:**
- Top row: 4 KPI stat cards (Total BOPD, Avg SOR trailing 30d, Active Alerts, Wells in Alarm) — each with a sparkline.
- Second row (2/3 + 1/3 split): 
  - Left: mini schematic/geographic map preview (click-through to `/field/map`), well markers colored by `status`.
  - Right: Alerts feed (latest 5, "View all" → `/field/alerts`).
- Third row: well grid — one `WellSummaryCard` per well (health ring, flow rate, status badge, sparkline, click → `/well/[id]/twin`). Sortable/filterable by status/health.
- Fourth row: Field production treemap (by well) + status donut, side by side.

### 9.2 Fleet Map (`/field/map`) — geographic + schematic, both required

**Layout:** a top-level view toggle: **[Geographic] [Schematic]** — shared well-selection state, same right-hand detail drawer regardless of which map is active.

**Geographic mode:**
- MapLibre GL map centered on Baghewala (Jaisalmer district, Rajasthan — use illustrative coordinates seeded in `config/wells.json` until OIL provides surveyed well coordinates; label this clearly as illustrative in a small map-corner note, not hidden).
- Base layer: OSM raster or MapTiler satellite (configurable — for an eventual on-prem/air-gapped OIL deployment, this base layer swaps to a self-hosted tile server; keep the base-layer URL in config, never hard-coded).
- Well markers: colored dot by `status` (producing = `--status-safe`, shut-in = `--text-muted`, css_active = `--accent-thermal`, alarm = `--status-critical`), clustered when zoomed out (use `supercluster` via `react-map-gl`'s clustering support).
- Field boundary: a translucent polygon overlay for the ~200 km² PML lease boundary (illustrative until real GIS boundary data is available).
- Click a marker → right-hand slide-in drawer with a `WellSummaryCard` + "Open full twin →" button.
- Hover a marker → lightweight popover with name, status, flow rate.

**Schematic mode:**
- Custom top-down SVG "plant layout": well pads arranged in their approximate relative grid positions (not geographically accurate — just spatially organized for legibility), connected by gathering-line paths to a central **Collection & Heating Facility** icon, which connects to a **Bowser Loading Bay** icon, with an arrow toward "→ Mehsana" labeled off-canvas (per the well-to-surface transport chain described in the research doc: well-site storage → heating for flowability → bowser transport → Mehsana).
- Pan/zoom via `react-zoom-pan-pinch`.
- Each well pad icon shows a small status ring (reuse the `RadialGauge` component at a small size) and is clickable → same detail drawer as geographic mode.
- This view is the one that should look like a genuine industrial HMI/SCADA mimic — grid-snapped icons, orthogonal connector lines, no organic/curvy decoration.

**Shared:** a filter bar above both maps — filter by status, by health-% threshold, by "has active alert."

---

## 10. Page Specs — Well Level (existing 6, upgraded)

For each: keep the existing page's information architecture (it's already good), the two required upgrades are (a) parameterize by `wellId` from the route instead of a hard-coded well, and (b) source every number through the data layer (§5) instead of inline constants. Only net-new elements are called out below.

### 10.1 Well Twin (`/well/[id]/twin`)
- Existing: subsystem selector, invisible-subsurface-state cards (bottomhole temp/viscosity/rod drag/fillage, each with trend + confidence), physics/ML agreement panel, rod-floating risk gauge, component dossier, decision-engine advisory card, Time Machine.
- **New:** a compact **embedded 3D preview** panel (small, non-interactive camera, auto-rotating) with a "Open full 3D view →" link to `/well/[id]/3d` — see §11.7. Also add the `PhaseTimeline` chart (§8) showing where "now" sits within the current CSS cycle's inject/soak/produce blocks.

### 10.2 Physics (`/well/[id]/physics`)
- Existing: explainable equations, thermal decay curve, viscosity-temperature curve.
- **New:** render the actual calibrated parameters (`τ`, `μ_ref`, `B` from main doc §11) as an editable-by-Engineer-only panel (read-only for other roles) so the page also doubles as the physics-calibration inspector, not just a static explainer.

### 10.3 Diagnostics (`/well/[id]/diagnostics`)
- Existing: dynamometer overlay, guided failure replay, condition classifier.
- **New:** classifier confidence badge must visually distinguish `label_source: ground_truth` (synthetic-validated) vs `weak` (real-data-calibrated) per the AI/ML doc §5.4 — use a small icon/tooltip distinction, not just a number, this is a genuine trust signal worth surfacing.

### 10.4 Simulator (`/well/[id]/simulator`)
- Existing: what-if parameter form → predicted trajectory.
- **New:** side-by-side comparison chart (baseline vs. simulated) using the shared time-series chart component, plus a "Send to Optimizer" button that seeds the Optimizer page with the simulated parameters as a fourth candidate strategy.

### 10.5 Optimizer (`/well/[id]/optimizer`)
- Existing: Strategy A/B/C cards, Pareto scatter, economic cutoff chart.
- **New:** add the `EconomicWaterfall` chart (§8) breaking down the recommended strategy's net value (gross revenue − lifting cost − thermal cost − risk-adjusted maintenance).

### 10.6 Control (`/well/[id]/control`)
- Existing: VFD modulation card, 7-item interlock matrix, approve/dispatch.
- **New:** an audit trail panel at the bottom of the page (last 10 `audit_event` rows for this well — approved/rejected/dispatched — per main doc §14.3), because "who approved what" should be visible right where the approval happens, not only in Reports.

---

## 11. 3D Well Visualization — Dedicated Section

**Route:** `/well/[wellId]/3d` (full-screen dedicated experience) + an embedded read-only preview on the Twin page (§10.1).
**This is not a decorative render.** Every visual element below is bound to a real field in `WellState`/`DynamometerCard` (§6). If a value is unavailable, the corresponding visual element must show a defined "no data" material/state, never fabricate motion.

### 11.1 Purpose
Give an operator or judge an immediate, physically-grounded read of "what does this well look like right now, from surface to bottomhole" — surface equipment, tubulars, rod string, reservoir — with the same data (temperature, viscosity, load, risk) shown elsewhere on the site, but understood spatially instead of numerically.

### 11.2 Scene composition (build as separate, composable R3F components)

| Component | Geometry approach | Data binding |
|---|---|---|
| `<SurfacePad>` | Ground plane + simple procedural wellhead housing + pumping-unit silhouette (walking beam, horsehead, crank — low-poly procedural boxes/cylinders, not a hyper-realistic asset; this is an instrumentation view, not a game render) | `spm` drives the walking-beam rotation speed |
| `<PumpingUnit>` | Articulated procedural rig: crank → pitman → walking beam → horsehead → polished rod, correctly linked so rotation drives reciprocating vertical motion | `spm`, `strokeLenIn` from `WellState.observed` |
| `<Wellbore>` | A vertical instanced cylinder stack representing casing (outer) and tubing (inner), scaled to the well's true `depthM` mapped onto a fixed scene-space depth scale | `well.depthM`, perforation interval marked as a distinct geometry band |
| `<RodString>` | A thin cylinder running inside the tubing from surface to pump depth, position animated in sync with `<PumpingUnit>`'s reciprocation | `rodPosition` trace when available (live), else derived from `spm`+`strokeLenIn` (demo) |
| `<DownholePump>` | Simple procedural plunger/barrel geometry at `pumpBarrelDepth` | static geometry, colored by current load state |
| `<ReservoirSlab>` | A translucent horizontal slab at the formation depth, material color driven by a temperature gradient shader | `inferred.bottomholeTempC` |
| `<FluidFlowParticles>` | GPU-instanced particle stream inside the tubing, moving upward, particle speed ∝ flow rate, particle color ∝ viscosity (denser/slower-looking at high cP) | `observed.flowBopd`, `inferred.viscosityCp` |
| `<DepthRail>` | The signature depth-rail motif (§3.1) rendered as a 3D ruler alongside the wellbore, tick marks at 0/200/400/.../depth, current-depth marker | static + highlights the perforation/pump depths |
| `<RiskOverlay>` | Color-coded danger bands along the rod string (green/amber/red per `rodFloatingRiskPct` thresholds from main doc §11.5) | `rodFloatingRiskPct` |

### 11.3 Data-layer overlay modes (toggle bar, matches existing site copy exactly)
Seven modes, each swaps materials/shaders on the scene without changing geometry:

| Mode | What changes |
|---|---|
| **Structure** | Neutral materials, all components visible in "engineering diagram" grey/steel tones — the default |
| **Temperature** | `<ReservoirSlab>` and `<Wellbore>` recolored via a cool→hot gradient (uses `--depth-gradient-start/end` tokens) driven by depth-interpolated temperature |
| **Pressure** | Tubing/casing recolored by pressure differential; subtle pulsing shader intensity ∝ pressure |
| **Viscosity** | `<FluidFlowParticles>` density/opacity/speed driven by `viscosityCp` — thicker, slower-looking flow at higher viscosity |
| **Drag** | `<RodString>` recolored by segment-wise viscous drag load |
| **Rod Risk** | `<RiskOverlay>` becomes the dominant visual, other elements dim to let the risk bands read clearly |
| **Fluid Flow** | Particle system emphasized, everything else semi-transparent wireframe |

### 11.4 Camera & interaction
- `OrbitControls` (drei) with constrained polar angle (can't flip below ground plane), min/max zoom distance tuned to the wellbore's scene-space height.
- **Camera bookmarks** (buttons): Surface View, Downhole/Pump View, Full Wellbore, Cross-Section.
- **Cross-section mode:** a clip-plane (three.js `Plane` + `material.clippingPlanes`) that slices the casing/tubing open along one axis so the rod string and fluid particles inside are visible — toggled by a dedicated button, not always on (it's a diagnostic mode, not the default view).
- **Component click:** clicking `<PumpingUnit>`, `<Wellbore>`, `<RodString>`, `<DownholePump>`, or `<ReservoirSlab>` opens the same "Component Dossier" side panel pattern already used on the existing Twin page (depth range, current values, status) — reuse that component, don't rebuild it for 3D.
- **Time Machine integration:** the existing scenario scrubber (Normal/Cooling/Rod Floating/Cut-off/Energy Min, speed 1x/2x/5x) must also be present on this page and must drive the 3D scene's material/animation state in lockstep with every other page — implement this by having the scrubber write to the same `WellState` stream (via `DemoDataProvider.playScenario`, §5), which every subscribed component (2D charts and 3D scene alike) reads from identically. The 3D scene must never have its own separate/duplicate time source.

### 11.5 Multi-well fleet 3D (stretch goal, build only after 11.1–11.4 are solid)
A field-wide 3D view showing several wellbores as parallel columns at correct *relative* depths (not geographic x/y — a stylized row layout is fine), for a "walk the field" overview. Use `InstancedMesh` for repeated geometry (casing segments, rod segments) across wells — this is a performance requirement, not a style choice, once you're rendering more than ~5 wellbores simultaneously.

### 11.6 Performance & fallback (non-negotiable for "production ready")
- **Target:** 60fps on a mid-range laptop integrated GPU for the single-well view; 30fps minimum acceptable for the multi-well stretch view.
- **LOD:** collapse the rod string and casing to fewer segments beyond a camera-distance threshold (`drei`'s `<Detailed>` or manual distance check).
- **Particle count cap:** fluid-flow particles capped (e.g., 500) and instanced, never one mesh per particle.
- **Reduced-motion respect:** if `prefers-reduced-motion` is set, disable the walking-beam/rod reciprocation animation and particle motion by default, replacing with a static "current state" pose — the data-driven coloring (temperature/risk/etc.) still updates, only the continuous motion stops.
- **Low-end/mobile fallback:** detect WebGL2 support and a rough capability heuristic (e.g., `navigator.hardwareConcurrency`, or a quick render-time probe); below threshold, render a **static, data-bound 2D cross-section SVG** of the same wellbore (reuse the `DepthRail` + a simplified side-view schematic) instead of the 3D scene, with a note ("3D view requires a more capable device — showing 2D schematic") and a manual "Try 3D anyway" opt-in. Never silently fail to a blank canvas.
- **Accessibility:** the 3D canvas is inherently not screen-reader-navigable — provide an adjacent, visually-hidden-but-screen-reader-visible live region (`aria-live="polite"`) that announces the current overlay mode and key state values (e.g., "Temperature mode. Bottomhole temperature 111°C, rising risk of rod floating at 43%.") whenever they change materially, so the page's information is still available non-visually.

### 11.7 Embedded preview (on the Twin page, §10.1)
A smaller, non-interactive instance of the same scene (`<WellboreScene interactive={false} autoRotate />`) — same components, same data binding, camera locked to a fixed "Full Wellbore" bookmark, slow auto-rotation, no overlay-mode toggle (always "Structure" mode to stay visually calm inside a page that's already dense with 2D data). This must be the **same component**, parameterized, not a separate simplified reimplementation — that's what keeps the preview and the full view from silently drifting apart in what they show.

### 11.8 Testing approach for the 3D module
- **Unit:** scene-graph construction functions (e.g., "given this `WellState`, does `<RodString>` compute the correct y-position?") tested as pure functions, independent of any actual WebGL rendering.
- **Smoke test:** a headless WebGL context test (`headless-gl` or Playwright's real browser rendering) asserting the canvas mounts without throwing and reaches a first rendered frame, run in CI.
- **Visual regression:** Playwright screenshot comparison on the "Structure" mode, default camera, for a fixed demo `WellState` fixture — catches accidental geometry/material regressions.
- Do not attempt pixel-perfect visual regression on animated/particle states — those are inherently non-deterministic frame-to-frame; only snapshot static/paused states.

---

## 12. Page Specs — Cross-Cutting

### 12.1 Alerts & Events (`/field/alerts`)
Fleet-wide, filterable (by well, severity, type) event timeline — sensor faults, interlock trips, recommendation approvals/rejections, model promotions (per AI/ML doc §16.3's audit event types). Use the `PhaseTimeline`/timeline chart pattern from §8, plus a sortable table underneath for detail.

### 12.2 Reports & Analytics (`/field/reports`)
Historical, exportable views: `CycleCalendar` (CSS cycle history), production trend by well over a selectable date range, SOR/energy-per-barrel trend, a fleet `FleetHealthHeatmap`. Include a CSV/PDF export action (client-side generation is fine; no new backend dependency required for v1).

### 12.3 Well Comparison (`/field/compare`)
Pick 2–3 wells → side-by-side stat cards + one shared `RadarChart` (multi-KPI: production, SOR, energy/bbl, rod risk, health%) so relative strengths/weaknesses are visible at a glance.

### 12.4 Admin / Settings (`/admin`, Engineer/Admin only)
- Interlock threshold editor (the 7-item matrix from Control, but editable, with a confirmation dialog and an audit-logged change).
- User/role management table (Admin only).
- Model registry status (read-only view pulling from the AI/ML doc's MLflow registry: current `Production`-stage model per family, version, promoted-by, promoted-at) — this page is where "is the AI trustworthy right now" gets a home outside the operator-facing pages.

---

## 13. Component Library

Build these once, in `components/`, and reuse everywhere rather than duplicating markup per page:

| Component | Used by |
|---|---|
| `<StatCard>` | value + label + trend + optional sparkline; every KPI everywhere |
| `<RadialGauge>` | health%, risk%, confidence% |
| `<EstimatedBadge label source confidence>` | wraps any inferred value, shows the ground-truth/weak-label distinction (§10.3) |
| `<WellSelector>` | top bar well switcher, Compare page picker |
| `<ScenarioPlayer>` (Time Machine) | every well-level page + 3D view, single shared implementation |
| `<DataModeToggle>` | top bar |
| `<RoleGate>` | anywhere an action is role-restricted |
| `<AlertBadge>` / `<AlertRow>` | top bar bell, Alerts page |
| `<RecommendationCard>` | Twin advisory panel, Control page |
| `<InterlockRow>` | Control page matrix |
| `<ComponentDossier>` | Twin page subsystem click, 3D view component click (§11.4) |
| `<WellboreScene>` | 3D page (interactive) and Twin preview (non-interactive) — one component, one prop flag |

---

## 14. State Management

- **Server state (all data-layer reads/writes):** TanStack Query exclusively. Query keys namespaced by well and resource: `['well', wellId, 'state']`, `['well', wellId, 'dynamometer']`, `['fleet', 'summary']`. Mutations (`approveRecommendation`, `simulate`) use `useMutation` with optimistic updates for approve/reject (instant UI feedback, roll back on failure).
- **Client/UI state:** Zustand stores, kept small and single-purpose:
  - `useDataModeStore` (§5.4)
  - `useSelectedWellStore` (drives the top-bar switcher + sidebar "WELL:" section label)
  - `useSceneStore` (3D overlay mode, camera bookmark, cross-section toggle — scoped to the 3D page, not global)
  - `useTimeMachineStore` (current scenario, playhead position, speed) — this one *is* effectively global-per-well since it drives both charts and the 3D scene simultaneously (§11.4)
- **No prop-drilling of well data** more than one level — use the `/well/[id]/layout.tsx` context (§4) for anything below the top of a well's page tree.

---

## 15. Non-Functional Requirements

### 15.1 Accessibility
- All interactive controls keyboard-reachable and visibly focus-ringed (per frontend-design skill's quality floor).
- Color is never the sole signal — status always paired with an icon or label (critical for the colorblind-safe reading of thermal/mechanical/risk color coding in §3.1).
- `prefers-reduced-motion` respected globally, not just in the 3D view (§11.6).

### 15.2 Performance
- Route-level code splitting (Next.js default) — the 3D libraries (`three`, `@react-three/*`) must be dynamically imported only on routes that use them (`/well/[id]/3d` and the Twin page's preview), never in the main bundle.
- Charts virtualize/limit rendered points for long time ranges (downsample telemetry client-side beyond ~2,000 points per series).

### 15.3 Responsive behavior
Primary targets: desktop control-room monitor (≥1440px) and field tablet (≥768px landscape). Below 768px: sidebar collapses to an icon rail, multi-column KPI rows stack to 2-column, the 3D view shows a "best viewed on a larger screen" notice with the 2D fallback (§11.6) rather than attempting a cramped full 3D scene.

### 15.4 Testing requirements
- **Unit/component (Vitest + RTL):** every chart component's loading/error/empty states; `RoleGate` visibility logic; data-layer provider selection logic (§5.4).
- **Integration:** the demo-data flow end-to-end for at least one full scenario playback (Time Machine drives Twin + Diagnostics + 3D preview in sync).
- **E2E (Playwright):** login → fleet overview → click a well → navigate through all 7 well-level pages via sidebar → approve a recommendation on Control → confirm it appears in the audit trail (§10.6).
- **Visual regression:** key pages (Fleet Overview, Twin, Optimizer, 3D Structure mode) snapshotted against a fixed demo fixture.

---

## 16. Build Phases & Definition of Done

Work through these in order. Each phase's DoD must be met (and ideally covered by the tests in §15.4 relevant to it) before starting the next.

| Phase | Scope | Definition of Done |
|---|---|---|
| 0 | Project scaffold: Next.js App Router + TS strict + Tailwind + shadcn/ui + design tokens from §3 + lint/format + CI skeleton | `npm run build` succeeds; design tokens usable as Tailwind theme values; empty shell deploys to Vercel |
| 1 | Data layer: canonical types (§6), `DigitalTwinDataProvider` interface, `DemoDataProvider` with physics-consistent generator (§5.3), `DataModeToggle` UI, `LiveDataProvider` stub (typed, throwing "not implemented" until backend exists) | A test page can call `useDataProvider().getWellState('BGW-08')` and get typed, physically-consistent demo data; toggle switches provider without a page reload |
| 2 | App shell: top bar, sidebar (all routes present, even as placeholder pages), well switcher, `RoleGate`, auth stub | Every route in §4 exists and is reachable from the sidebar in ≤1 click; role-gated items correctly hide/show for each mock role |
| 3 | Fleet Overview + Fleet Map (both geographic and schematic) | `/field` shows live-updating KPIs + well grid from demo data; `/field/map` toggles between both map modes sharing well-selection state; clicking a well navigates to its Twin |
| 4 | Well Twin page, parameterized, wired to data layer, with `PhaseTimeline` and embedded 3D preview stub (static placeholder OK at this phase) | Switching wells via the top bar updates every number on the Twin page; Time Machine scrubber drives all of them in sync |
| 5 | Physics page | Curves render from the same physics module backing the demo generator (§5.3) — i.e., provably the same math, not a separately hand-tuned chart |
| 6 | Diagnostics page | Dynamometer overlay renders from `DynamometerCard` demo data; classifier confidence badge shows ground-truth/weak distinction |
| 7 | Simulator page | What-if form produces a second series on the comparison chart; "Send to Optimizer" correctly seeds a 4th strategy |
| 8 | Optimizer page | Strategy cards, Pareto scatter, and `EconomicWaterfall` all reflect the same underlying strategy data (no independently-mocked numbers per chart) |
| 9 | Control page | Interlock matrix reflects live-updating demo values; approve/reject writes to the audit trail panel in real time |
| 10 | 3D Well Visualization — full build per §11 (11.1 through 11.4 required; 11.5 optional stretch) | Hits the performance target in §11.6 on a mid-range laptop; Time Machine drives 3D state in lockstep with 2D pages; reduced-motion and low-end fallback both verified manually |
| 11 | Alerts, Reports, Compare pages | Each renders from demo data with correct empty/loading states |
| 12 | Admin page | Role-gated correctly; interlock threshold edits are audit-logged (even against demo data) |
| 13 | Polish pass | a11y audit (axe or equivalent) clean on all pages; responsive check at 1440/1024/768; every chart's loading/error/empty state manually verified |
| 14 | Testing | Test suite from §15.4 passing in CI |
| 15 | `LiveDataProvider` real implementation | Wired against the actual backend once available, per main doc §16; toggling to Live mode with a real backend running shows identical UI behavior to Demo mode |

---

## 17. Folder Structure

```
app/
  (auth)/login/
  field/
    page.tsx                # Fleet Overview
    map/page.tsx
    alerts/page.tsx
    reports/page.tsx
    compare/page.tsx
  well/[wellId]/
    layout.tsx               # resolves well, provides context
    twin/page.tsx
    physics/page.tsx
    diagnostics/page.tsx
    simulator/page.tsx
    optimizer/page.tsx
    control/page.tsx
    3d/page.tsx
  admin/page.tsx
components/
  shell/            (TopBar, Sidebar, RoleGate)
  charts/           (one file per chart type in §8)
  scene/            (SurfacePad, PumpingUnit, Wellbore, RodString, DownholePump,
                      ReservoirSlab, FluidFlowParticles, DepthRail, RiskOverlay, WellboreScene)
  cards/            (StatCard, WellSummaryCard, RecommendationCard, ComponentDossier)
  common/           (RadialGauge, EstimatedBadge, ScenarioPlayer, DataModeToggle, WellSelector)
data/
  provider.ts                 # interface, §5.1
  demo/
    DemoDataProvider.ts
    physicsSim.ts              # shared with backend synthetic generator conceptually
    scenarios/                  # 5 scenario configs
  live/
    LiveDataProvider.ts
  types.ts                     # §6 contracts
state/
  useDataModeStore.ts
  useSelectedWellStore.ts
  useSceneStore.ts
  useTimeMachineStore.ts
config/
  wells.json                    # illustrative well coordinates/metadata, §9.2
  tokens.ts                     # §3 design tokens as a single source of truth
tests/
  unit/ integration/ e2e/ visual/
```

---

## 18. Environment Configuration

```
NEXT_PUBLIC_DEFAULT_DATA_MODE=demo
NEXT_PUBLIC_API_BASE_URL=            # LiveDataProvider target, per main doc §16
NEXT_PUBLIC_WS_BASE_URL=
NEXT_PUBLIC_MAP_TILE_URL=            # swappable base layer for §9.2, self-hosted-ready
NEXT_PUBLIC_MAPTILER_KEY=            # optional, only if using a hosted tile provider
```
No secrets in the frontend beyond public map-tile keys — auth tokens are handled server-side/via httpOnly cookies once `LiveDataProvider` is real (Phase 15).

---

## 19. Open Questions / Assumptions to Confirm

1. **Well coordinates:** `config/wells.json` will ship with illustrative Baghewala-area coordinates for the ~23–35 wells referenced in OIL's public material — confirm whether you want all of them stubbed now, or just a handful ("featured" wells) with the rest as lightweight placeholders until real survey data exists.
2. **Auth provider:** this spec assumes a simple JWT/role-cookie auth stub for now (Phase 2) — confirm if you want a specific provider (Auth0/Clerk) wired now or kept as a stub until the backend's Auth Service (main doc §9) exists.
3. **3D asset fidelity:** this spec deliberately specifies **procedural low-poly geometry**, not imported 3D models/textures, to keep the bundle light and the data-binding straightforward — confirm that's the right call versus investing in higher-fidelity modeled assets (a real trade-off between "looks like a game" and "loads fast, ships on schedule").
4. **Map tile provider for the geographic view:** OpenStreetMap raster tiles work with zero setup/cost; MapTiler satellite imagery looks better but needs an API key — confirm which to default to for the demo.

---

*This document should be read alongside the main architecture doc's §7–9 (which it supersedes for frontend purposes) and the AI/ML doc's §5 and §16.3 (which define the ground-truth/weak-label distinction surfaced in §10.3 and the audit event types surfaced in §12.1 above).*
