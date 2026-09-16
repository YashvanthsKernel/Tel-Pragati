# TEL PRAGATI — 5-Minute Pitch Script

**Team:** JAL MITRA  
**Total Time:** 5 minutes  
**Speakers:** Wasee (2 min) → Yashvanth (2 min) → Sindhu (1 min)

---

## WASEE — 2 Minutes
### Problem & Solution (Slides 1–2)

---

**[SLIDE 1 — Title]** *(5 seconds)*

Good morning. We are Team Jal Mitra, and this is TEL PRAGATI — a physics-first, AI-corrected digital twin for Oil India Limited's Baghewala heavy oil field.

**[SLIDE 2 — Problem Statement + Solution]** *(remaining ~1:50)*

**[Point to PROBLEM STATEMENT section]**

Baghewala crude is 13,000 centipoise at 50 degrees Celsius — two hundred times thicker than water. The only way to make it flow is Cyclic Steam Stimulation. You inject steam, you soak, you produce. But here's what happens every single cycle: the reservoir cools silently. Viscosity climbs back up. Rod drag rises. Pump fillage drops. And production degrades — before anyone notices.

Unplanned shutdowns from rod floating and rod parting cost 38,000 to 60,000 rupees per well per day. And the root cause? CSS and SRP are optimized by two different teams, on two different screens, using two different tools. Weatherford ForeSite handles the pump. CMG STARS handles the reservoir. No commercial tool in the world jointly optimizes both as one coupled system.

That is the silo TEL PRAGATI breaks.

**[Point to SOLUTION section]**

TEL PRAGATI treats the reservoir, the wellbore, and the surface equipment as ONE continuously-updated state model.

The pipeline has five stages. SENSE and ESTIMATE: we take wellhead telemetry — temperature, current, rod load, SPM — and run it through Boberg-Lantz thermal decay and Andrade viscosity models to compute the things you cannot directly measure — bottomhole temperature, viscosity, rod drag, and fillage.

FUSE: Physics and ML independently estimate the same quantities. We merge them via Ensemble Kalman Filter — not a blended average, but a calibrated confidence score with agreement percentage.

PREDICT: We forecast viscosity rise and rod floating risk 6 to 12 hours ahead from the thermal decline curve. We alert before failure — not after.

OPTIMIZE: NSGA-II jointly optimizes CSS and SRP as one system — production, SOR, energy cost, and rod risk on a single Pareto frontier.

PROTECT and ACT: Every recommendation passes through a 7-gate deterministic safety interlock. Zero ML in the safety path. ML proposes. Physics gates. The operator approves. Full audit trail.

**[Point to PROBLEM SOLVED metrics]**

The projected impact: 8 to 14 percent increase in oil recovery per cycle. 12 to 18 percent SOR reduction. Greater than 65 percent fewer rod failures. 2.5x pump life extension. 10.3 crore rupees per year in field-wide savings. And our physics model validated against OIL India's BGW-08 pilot data at 9.1 percent error — true out-of-sample.

**[Transition]** I'll hand it over to Yashvanth for the technical architecture.

---

## YASHVANTH — 2 Minutes
### Technical Approach + Feasibility (Slides 3–4)

---

**[SLIDE 3 — Technical Approach]** *(~1:00)*

**[Point to TECH STACK]**

The frontend is built on Next.js 15 with React 19, Three.js for the 3D wellbore visualizer, and D3 plus Plotly for engineering-grade charts. The backend is a FastAPI monolith with clean module boundaries — designed for graceful degradation. If TimescaleDB or MQTT go down at startup, the system falls back to physics-driven synthetic mode without crashing.

Data infrastructure: TimescaleDB for time-series telemetry stored as hypertables. PostgreSQL for relational data — wells, users, audit events. Redis for the feature store and session cache. MQTT via Mosquitto for real-time sensor streaming. MLflow for model versioning and experiment tracking.

**[Point to ARCHITECTURE DIAGRAM / METHODOLOGY]**

The architecture follows a closed decision loop — Sense, Validate, Estimate, Predict, Optimize, Protect, Act — and back to the field. The intelligence core has four layers: the physics engine with five first-principles models, the AI/ML engine with five trained models, the decision engine with Kalman fusion and NSGA-II optimization, and the safety interlock layer with seven deterministic gates.

A critical design decision: we run two data modes — demo and live — through the exact same pipeline. Demo mode uses physics-calibrated synthetic data. Live mode connects to real SCADA. Nothing in the architecture changes when real data arrives. You can scan the QR code on slide 2 to try the live prototype right now.

**[SLIDE 4 — Feasibility & Viability]** *(~1:00)*

**[Point to CHALLENGES → SOLUTIONS]**

We want to be transparent about the six hardest engineering challenges we faced and how we solved each one.

First — you cannot directly measure bottomhole temperature or viscosity. Downhole gauges cost 15 to 30 lakhs per well. Our solution: the Boberg-Lantz to Andrade to Gibbs inference chain computes both from surface measurements alone — under 5 degrees BHT error, zero downhole hardware.

Second — four of our five ML models failed at launch. Failure risk AUC was 0.47 — worse than a coin flip. Root cause: data leakage in the train-test split. We fixed it with chronological splitting, physics-calibrated synthetic data with realistic noise, and physics-first fallback — the system never goes dark when ML fails.

Third — normal CSS phase transitions flood every standard anomaly detector with false alarms. Our Phase-Aware Danger Engine, inspired by Matzinger's immune danger theory, contextualizes alerts by current CSS phase. Rod floating is flagged 2 to 4 hours before failure — not after.

**[Point to FEASIBILITY + SCALABILITY]**

On feasibility: TEL PRAGATI uses existing SCADA infrastructure. No new sensors. No new hardware. Incremental cost is mainly software, integration, and deployment. On scalability: pilot on selected wells, validate, expand progressively to multi-well fleet, then field-wide. The architecture already handles 23 wells simultaneously.

**[Transition]** Sindhu will cover impact and market.

---

## SINDHU — 1 Minute
### Impact & Market (Slide 5)

---

**[SLIDE 5 — Impact and Benefits]** *(~1:00)*

**[Point to BENEFITS row]**

TEL PRAGATI delivers three categories of benefit. Economic: higher oil recovery with lower steam use, reduced operating costs. Social and human: predicting pump and rod failures before they happen improves field safety and reduces unplanned downtime. Environmental: optimizing the Steam-Oil Ratio directly lowers carbon footprint per barrel of oil produced.

**[Point to IMPACT stakeholders]**

For production engineers — a target 10 percent production increase, from 600 to 660 BOPD field-wide. For operations — 15 percent reduction in energy consumption per barrel. For maintenance teams — 20 percent reduction in unplanned maintenance hours. For asset managers — 10 percent reduction in cost per barrel, from 1,000 to 900 rupees.

**[Point to TAM/SAM/SOM]**

The global oil and gas digital twin market is 3.8 billion dollars in 2024, growing at 16 percent CAGR to 9.1 billion by 2030. Our serviceable market is 8,000 CSS wells globally at roughly 10,800 dollars per well per year — 1,554 crore rupees. Our obtainable target: OIL India Baghewala in year one, ONGC and international CSS fields like Pertamina Duri and PDO Mukhaizna by year three — 45 crore rupees.

This is not a hypothetical market. OIL India signed a 210 crore contract with Kellton in 2024 for 77 wells. ONGC awarded a 125 crore AI contract in 2026. The industry is buying digital twins for heavy oil — right now.

**[Closing — confident, direct]**

TEL PRAGATI breaks the one silo nobody else has broken — CSS and SRP as one coupled, physics-first, AI-corrected, safety-gated system. The physics works. The prototype is live. The market is ready.

Thank you.

---

## TIMING SUMMARY

| Speaker | Section | Slides | Target Time |
|---------|---------|--------|-------------|
| Wasee | Problem + Solution + Impact Metrics | 1–2 | 2:00 |
| Yashvanth | Tech Stack + Architecture + Challenges + Feasibility | 3–4 | 2:00 |
| Sindhu | Benefits + Stakeholder Impact + Market + Close | 5 | 1:00 |
| **Total** | | | **5:00** |

---

## TIPS FOR DELIVERY

- **Wasee:** You own the narrative hook. The "13,000 centipoise" and "two different screens" lines should land with conviction — pause slightly after "No commercial tool." Don't rush the pipeline — the 5 stages ARE the solution. Point at the slide as you name each stage.

- **Yashvanth:** You own the technical credibility. The challenges section is your strongest moment — being honest about ML failures and then showing the fix is what separates you from every team that claims 99% accuracy. Speak with authority on the architecture, point at the diagram.

- **Sindhu:** You own the close. The TAM/SAM/SOM numbers need to land fast — don't dwell on each. The Kellton and ONGC contract references are your proof points. End with "The physics works. The prototype is live. The market is ready." — three short punches, then stop. Don't add "thank you for your time" or "any questions." Just: "Thank you." And stop.

- **All:** Practice transitions. Wasee to Yashvanth should be seamless — "I'll hand it over to Yashvanth for the technical architecture" while Yashvanth is already stepping forward. No dead air between speakers.
