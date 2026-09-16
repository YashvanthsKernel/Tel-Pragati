# TEL PRAGATI — Architecture Diagram Prompt (v2 — Clean)

> Paste the prompt below into GPT-4o image generation. Attach the original architecture diagram image as style reference.

---

## PROMPT

---

Create a professional technical architecture diagram. Match the reference image style exactly: white background, flat corporate icons, rounded pastel-filled boxes, thin black arrows, sans-serif font, landscape 16:9, generous whitespace. CRITICAL RULE: Maximum 3 words per box label. No paragraphs. No sentences. Icons carry meaning, not text. The diagram must feel complex through STRUCTURE (many boxes, many connections) — not through text density.

**TITLE (top center, bold):**
TEL PRAGATI — Well-to-Surface Digital Twin Architecture

**SUBTITLE (smaller, below title):**
AI + Physics + Real-Time Data | Optimize Production | Safer Operations

**LOOP BANNER (horizontal strip below subtitle, dark teal background, white text):**
SENSE → VALIDATE → ESTIMATE → PREDICT → OPTIMIZE → PROTECT → ACT

---

### ZONE 1 — LEFT (User Layer)

Person silhouette icon. Label: "User / Engineer"

Below: Large monitor icon. Label: "Digital Twin Dashboard"
Small text under monitor: "Next.js 15 + React 19"
Below the monitor, show 8 tiny icons in a 2x4 grid (NO text labels, just recognizable icons):
- Globe icon (Fleet Map)
- Cube icon (3D Twin)
- Waveform icon (Diagnostics)
- Sliders icon (Simulator)
- Target icon (Optimizer)
- Shield icon (Control)
- Chart icon (Physics)
- Gauge icon (Reports)

Above monitor: PDF icon. Label: "Report Generation"

Below monitor: Small strip with 3 colored pills in a row:
Green pill: "Advisory"
Yellow pill: "Supervised"  
Red pill: "Automated"
Arrows between them (→). No header needed.

---

### ZONE 2 — CENTER-LEFT (Intelligence Core)

4 horizontal bands stacked vertically, each a different pastel color:

**Band 1 — Light blue fill:**
Header: "Physics Engine"
5 small boxes in a row, each with a tiny icon + 2-word label:
- Flame icon: "Thermal Decay"
- Droplet icon: "Viscosity Model"
- Wave icon: "Gibbs PDE"
- Scale icon: "Floating Index"
- Coin icon: "Energy Economics"

**Prominent bidirectional arrow between Band 1 and Band 2:**
Label: "Physics ↔ ML"

**Band 2 — Light purple fill:**
Header: "AI / ML Engine"
Small text: "XGBoost • LightGBM • Isolation Forest"
5 small boxes in a row:
- Chart-up icon: "Forecaster"
- Droplet icon: "Viscosity Corrector"
- Card icon: "Dyno Classifier"
- Warning icon: "Failure Risk"
- Radar icon: "Anomaly Detector"

**Band 3 — Light green fill:**
Header: "Decision Engine"
3 boxes in a row:
- Crosshair icon: "Kalman Fusion (EKSF)"
- Target icon: "NSGA-II Optimizer"
- Heartbeat icon: "VFD Scheduler (TI-PVS)"

**Arrow down labeled: "→ Safety Gates"**

**Band 4 — Light coral/red fill:**
Header: "Safety Interlock"
Small text: "Zero ML — Rules Only"
7 tiny shield icons in a row, each with ONE word below:
SPM | PPRL | Tension | Current | Pressure | Confidence | Telemetry

Lock icon below Band 4. Label: "ML Proposes → Rules Gate → Human Approves"

---

### ZONE 3 — CENTER (Cloud Infrastructure)

Cloud icon. Label: "Cloud Server"
Below cloud: FastAPI logo. Label: "FastAPI"
Small text: "REST + WebSocket"

Below FastAPI, 4 tech logos stacked vertically with 1-2 word labels:
- Tiger icon: "TimescaleDB"
- Elephant icon: "PostgreSQL"
- Red diamond: "Redis"
- Blue M icon: "MLflow"

Right of cloud: Mosquitto logo. Label: "MQTT Broker"

Above cloud: Shield icon. Label: "Audit Trail"

---

### ZONE 4 — CENTER-RIGHT (Cross-Domain Innovation)

Header: "5 Novel Algorithms"

5 small colored accent boxes in a vertical column. Each box has ONLY a tiny icon + acronym + 2-word source:

- Heart icon (pink): "TI-PVS" / small text: "← Cardiac CLS"
- Pill icon (blue): "DZ-TCM" / small text: "← Pharmacokinetics"
- Shield icon (green): "PADSE" / small text: "← Immune Theory"
- Plane icon (gray): "EKSF" / small text: "← Aviation EKF"
- Leaf icon (teal): "MC-TREO" / small text: "← Ecology"

Thin dashed arrows from each box into Zone 2 (connecting to their target component).

---

### ZONE 5 — FAR RIGHT (Well Field)

Header: "Baghewala Well Field"
Small text: "23 Wells"

Pump jack illustration as the anchor visual.

5 stacked boxes with icons, each 2-3 words:
- Earth icon: "Reservoir Layer"
- Steam icon: "CSS Layer"
- Pump icon: "SRP Layer"
- Tank icon: "Surface Facilities"
- Gear icon: "Actuator / Control"

Bottom-right: Chip icon: "ESP32 Edge"

---

### BOTTOM STRIP — Data Acquisition

Full-width horizontal bar, light gray fill.

Header: "Data Acquisition — 9 Datasets, 35K+ Records"

7 icons in a row with 1-2 word labels:
Database: "SCADA" | Calendar: "CSS Cycles" | Gauge: "SRP/VFD" | Thermometer: "Pressure/Temp" | Oil drop: "Production" | Wrench: "Maintenance" | Waveform: "Dynamo Cards"

Thin sub-strip below:
"Quality Gating • Feature Engineering • Synthetic Generator • Sensor Scoring"

---

### ARROWS (data flow):

- Well Field (Zone 5) ←→ MQTT Broker ←→ FastAPI (Zone 3) — bidirectional, thick
- FastAPI ←→ Intelligence Core (Zone 2) — bidirectional
- Intelligence Core → Dashboard (Zone 1) — data flows left
- Dashboard → FastAPI → Actuator/Control (Zone 5) — control commands flow right (THIS CLOSES THE LOOP)
- Data Acquisition (bottom) → upward into FastAPI
- Cross-Domain (Zone 4) → dashed into Zone 2
- Report Generation → from AI/ML Engine

### COLOR PALETTE:
- Physics: #E3F2FD (sky blue)
- AI/ML: #F3E5F5 (lavender)
- Decision: #E8F5E9 (mint green)
- Safety: #FFEBEE (coral)
- Infra: #F5F5F5 (light gray)
- Field: #FFF8E1 (warm sand)
- Arrows: #424242 (dark gray)

### ABSOLUTE RULES:
- NO box should have more than 3 words as its main label
- Icons do the talking — every box MUST have an icon
- The diagram should have ~40-50 distinct elements but NOT feel cluttered
- Generous whitespace between zones
- Technology logos recognizable (FastAPI bolt, Redis diamond, TimescaleDB tiger, Mosquitto mosquito, MLflow)
- The CLOSED LOOP (sense → act → back to field) must be visually obvious through arrow flow
- 16:9 landscape, suitable for a PowerPoint slide
- Clean, professional, corporate infographic — NOT a Mermaid diagram or wireframe

---

**END OF PROMPT**
