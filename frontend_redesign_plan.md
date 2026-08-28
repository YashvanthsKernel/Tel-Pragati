# 🏭 TEL PRAGATI — Industrial Redesign Plan
## From: Space Theme → Real SCADA Control Room + Enterprise SaaS

---

## 🎯 Design Direction

| Dimension | Decision |
|---|---|
| **Aesthetic** | Industrial Control Room + Enterprise SaaS hybrid |
| **References** | Grafana, Datadog, Honeywell SCADA, OSIsoft PI Vision |
| **Border Radius** | Sharp — `rounded-sm` (4px) max, mostly square |
| **Typography** | Large bold numbers, small uppercase mono labels |
| **Dividers** | Clean horizontal rules between every section |
| **Sidebar** | Collapsible, clear section labels |
| **Status Bar** | NEW — Persistent bottom SCADA-style status strip |
| **Mode** | Full dark + light toggle |

---

## 🎨 New Color Palette — Industrial Multicolor

### Dark Mode (Charcoal Control Room)

| Token | Color | Role |
|---|---|---|
| `surface-0` | `#151719` | Page background |
| `surface-1` | `#1C1F23` | Panels |
| `surface-2` | `#222629` | Cards |
| `surface-3` | `#292D31` | Elevated elements |
| `line` | `#2E3338` | Borders |
| `line-strong` | `#3A4048` | Section dividers |
| `text-primary` | `#E4E8EC` | Main text |
| `text-muted` | `#5C6470` | Labels |
| **Amber/Gold** | `#F5A623` | Primary readouts, active states |
| **Teal** | `#00B4A0` | Mechanical / MQTT telemetry |
| **Blue** | `#3D8EF0` | Analytics / telemetry |
| **Red-Orange** | `#E85D42` | Thermal / steam / temperature |
| `status-safe` | `#2ECC71` | Healthy |
| `status-warn` | `#F39C12` | Warning |
| `status-critical` | `#E74C3C` | Alarm |

### Light Mode (Engineering Dayshift)
Warm off-white backgrounds (`#F4F5F7`), same accent colors but darkened 15% for contrast.

---

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  TOPBAR (h-14, flat border only, no glow)               │
│  Logo │ Well Selector │ Mode │ Alerts │ User            │
├──────────┬──────────────────────────────────────────────┤
│          │  PAGE CONTENT (pb-8 for status bar)          │
│ SIDEBAR  │  ━━━ Section Title ━━━━━━━━━━━━━━━━━━━━━━━━ │
│ (sharp   │  Content                                     │
│  labels) │  ━━━ Section Title ━━━━━━━━━━━━━━━━━━━━━━━━ │
│          │  Content                                     │
├──────────┴──────────────────────────────────────────────┤
│  STATUS BAR (fixed bottom, h-8)                         │
│  ● LIVE │ MQTT │ 12 Wells │ BGW-08 Selected │ v2.4.1  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Files to Change

---

### [MODIFY] `globals.css` + `tailwind.config.ts`
Complete token replacement — charcoal industrial palette, `rounded-sm` defaults, remove all neon glow shadows, add muted `shadow-panel` for cards.

---

### [NEW] `components/shell/StatusBar.tsx`
Persistent bottom status strip (32px):
```tsx
<footer className="h-8 bg-surface-2 border-t border-line fixed bottom-0 left-0 right-0 z-20 flex items-center px-4 gap-6 text-[11px] font-mono text-text-muted">
  <span className="flex items-center gap-1.5">
    <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse" />
    LIVE · MQTT CONNECTED
  </span>
  <span>12 WELLS ACTIVE</span>
  <span>WELL: {selectedWellId}</span>
  <span className="ml-auto">TEL PRAGATI v2.4.1 · OIL INDIA LIMITED</span>
</footer>
```

### [MODIFY] `components/shell/AppShell.tsx`
Add `<StatusBar />` and `pb-8` to main content.

---

### [MODIFY] `components/cards/StatCard.tsx`
SCADA instrument readout style:
- `rounded-sm` corners (sharp)
- `text-4xl font-black font-mono` for value
- Colored left border (4px) per variant — not top bar
- No background tint
- Clean `border-b border-line` divider above subtext
- Flat shadow only

```diff
- rounded-xl bg-surface-1 border ${borderColor} shadow-card
+ rounded-sm bg-surface-2 border border-line border-l-4 ${accentLeftBorder} shadow-panel
```

### [MODIFY] `components/cards/WellSummaryCard.tsx`
Instrument card with status header strip:
- Full-width colored header strip (not just left border)
- `rounded-sm`
- Status name in header, well name below
- Dense, readable layout

---

### [MODIFY] `components/shell/TopBar.tsx`
- Remove `shadow-topBarGlow`
- Remove live IST clock (moved to StatusBar)
- Flat `border-b border-line` only
- Sharp button styles (`rounded-sm`)
- Tighter layout

### [MODIFY] `components/shell/Sidebar.tsx`
- `rounded-sm` nav items (was `rounded-xl`)
- Active state: amber/gold fill, no animated indicator bar
- Dividers between sections as `border-t border-line-strong`
- Clean, no animations

---

### [MODIFY] `components/ui/PageHeader.tsx`
- Remove `rounded-full` badge → `rounded-sm`
- Thicker bottom divider: `border-b-2 border-line-strong`
- Page title: `text-xl font-bold` (not `text-3xl font-black`)

### [MODIFY] `components/ui/SectionCard.tsx`
- `rounded-sm`
- Header row: `bg-surface-3 border-b border-line` (no colored top bar)
- Stronger border: `border border-line-strong`

---

### [MODIFY] `app/login/page.tsx`
Clean enterprise split panel — **NO starfield, NO glassmorphism**:

```
┌────────────────────────────────────────────┐
│ [OIL Logo] OIL INDIA LIMITED · MoPNG GoI  │ ← top strip
├───────────────┬────────────────────────────┤
│               │                            │
│  OIL India    │  SECURE ACCESS PORTAL      │
│  Baghewala    │  ──────────────────────    │
│  Heavy Oil    │  SELECT ROLE    ▼          │
│  Digital Twin │  USER ID  ___________      │
│               │  PASSWORD ___________      │
│  [Logo img]   │                            │
│               │  [ACCESS DASHBOARD →]      │
│               │                            │
└───────────────┴────────────────────────────┘
```

Left: dark charcoal background, clean logo + branding.  
Right: slightly lighter surface, flat form inputs, sharp button.

---

### [MODIFY] `app/field/page.tsx`
Section dividers everywhere:
```
FLEET OPERATIONS OVERVIEW              [Map] [Reports]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[PRODUCTION] [SOR] [ALERTS] [ALARM]     ← StatCards
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FLEET HEALTH  ██████████░░░░ (well segments)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MAP 2/3 ──────────────] [ALERTS 1/3 ────────────]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WELL DIRECTORY  [Filters]
[BGW cards grid]
```

---

### [MODIFY] `app/well/[wellId]/twin/page.tsx`
- Replace `DataMeasurementCard` with sharp instrument cards
- Agreement: horizontal progress bar (same, keep it)
- Remove rounded corners throughout

### [MODIFY] `app/admin/page.tsx`
- Tab bar: flat underline tabs (not pill buttons)
- Tables: tighter row spacing, stronger header background

---

## 📊 Summary

| | Current | New |
|---|---|---|
| Theme | Deep Space / Neon | Industrial Charcoal |
| Border radius | `rounded-xl` (12px) | `rounded-sm` (4px) |
| Primary accent | Electric Cyan `#00D4FF` | Amber/Gold `#F5A623` |
| Shadows | Glow effects | Flat panel shadows |
| Status bar | None | Fixed bottom strip |
| Login | Starfield glassmorphism | Clean split panel |
| Card style | Soft with tint | Sharp instrument readout |

**Files changed: 12 | New files: 1 (StatusBar)**

---

> [!IMPORTANT]
> This is a **complete visual overhaul**. All Deep Space / neon colors and rounded-xl corners will be replaced. No routing or data changes.

> [!NOTE]
> Approve to begin implementation, or let me know any changes to the direction first.
