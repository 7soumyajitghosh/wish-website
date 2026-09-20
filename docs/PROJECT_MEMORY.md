# Project Memory 🧠

> **Project Wish AI — Living Knowledge Base & Project State**  
> *Last Updated: 2026-09-20*  
> *System Identity: Project Wish (`wish-website`)*  
> *Memory Architecture Standard: MemoryOS*

---

## 1. Project Overview & Core Goals

### 1.1 Mission
Project Wish is an emotional, interactive web platform crafted around the **16-stage journey of love**—from an initial dormant glowing seed rooted in earth, through organic trunk and branch growth, bursting into full radiant bloom with over 350 hearts, to releasing tender wishes into the celestial evening sky.

### 1.2 Primary Goals
1. **Uncompromising Cinematic Immersion:** Deliver 60 FPS procedural HTML5 Canvas visuals combined with zero-dependency Web Audio API procedural soundscapes.
2. **AI-Driven Memory & Personalization:** Integrate **MemoryOS** to provide long-term, self-healing memory across 6 architectural layers (User, Project, Conversation, Agent, Codebase, Knowledge Graph), preventing context rot.
3. **Interactive Emotional Journey:** Provide tangible user engagement through interactive timeline controls, openable 3D Love Letters, draggable wish launches into a heart-shaped sun, and ambient sound controls.
4. **Resilient Multi-Model AI Orchestration:** Route creative writing, sentiment analysis, and dynamic canvas shaders through an intelligent multi-provider gateway (Gemini, Claude, GPT, Ollama).

---

## 2. Current Implementation Status

| Feature / Subsystem | Status | Details / Implemented Files |
| :--- | :--- | :--- |
| **16-Stage Canvas Growth Engine** | 🟢 Complete (Production) | Procedural Bézier branches, root anchors, dynamic radial sunset lighting in `src/components/HeartTreeAnimation/` |
| **Procedural Sound Engine** | 🟢 Complete (Production) | Cmaj7/9 ambient drone, blooming chimes, wind swooshes in `src/audio/soundManager.ts` |
| **Timeline HUD & Navigation** | 🟢 Complete (Production) | 16-step scrubber, speed multiplier (0.5x - 2.0x), play/pause, story context integration in `src/components/Navigation/` and `src/components/CinematicExperience/` |
| **Interactive Love Letter** | 🟢 Complete (Production) | Unfolding letter modal, customizable text, romantic calligraphy styling in `src/components/LoveLetter/` |
| **Draggable Wish Release** | 🟢 Complete (Production) | Physics-driven heart launch towards the Heart Sun, starfield backdrop in `src/components/WishSection/` |
| **Story Context & State** | 🟢 Complete (Production) | React Context managing unlock barriers, quotes, wind vectors, and stage indices in `src/context/StoryContext.tsx` |
| **Visual QA Inspector** | 🟢 Complete (Production) | Side-by-side comparison modal with the 16-panel storyboard |
| **MemoryOS Integration** | 🟡 Active Rollout | Architecture defined, 6 memory layers structured in `/memory/`, self-healing drift engine ready |
| **Backend API Gateway** | 🔵 In Progress | Fastify / FastAPI gateway interface defined in `/architecture/services.md` |
| **AI Multi-Model Gateway** | 🔵 In Progress | Model router with capability-cost-latency arbitrage detailed in `/docs/MODEL_ROUTING.md` |

---

## 3. Important Decisions (ADR Summary)

### ADR-001: Zero External Audio File Dependencies
- **Context:** External MP3/WAV audio assets introduce latency, bandwidth overhead, network failure modes, and copyright constraints.
- **Decision:** Utilize the native browser **Web Audio API** to procedurally synthesize ambient drones, blooming bells, and wind sweeps using oscillators, biquad filters, and exponential gain curves.
- **Consequence:** 100% offline availability, instant zero-byte loading, dynamically reactive audio parameters tied to user interaction.

### ADR-002: Dual Rendering Architecture (Procedural Canvas + React DOM)
- **Context:** Rendering 350+ animated leaf hearts, dynamic roots, and particle wind via pure DOM elements causes severe frame drops and garbage collection pauses.
- **Decision:** Separate the presentation into a high-performance 2D Canvas for physics/growth simulation (`HeartTreeAnimation`) and React DOM/Tailwind components for interactive UI controls, modals, and input forms.
- **Consequence:** Smooth 60 FPS animation on low-power mobile devices alongside semantic accessibility for inputs and buttons.

### ADR-003: Adoption of MemoryOS Self-Healing Memory Architecture
- **Context:** Standard LLM agent memory architectures suffer from progressive "Context Rot" and semantic drift over multi-turn user sessions.
- **Decision:** Implement MemoryOS's 6-layer memory model with mathematical drift detection:
  $$\text{drift}(t) = 1 - \text{cosine\_similarity}(v_{\text{baseline}}, v_{\text{current}})$$
  and automated auto-healing when $\text{drift} \ge 0.45$.
- **Consequence:** Prevents agent hallucination, preserves foundational user intent, and ensures long-term consistency.

### ADR-004: Pure CSS + GSAP Hybrid Animation Model
- **Context:** Managing complex entry/exit animations, timeline sequencing, and physics dragging.
- **Decision:** Combine Tailwind CSS v4 utility styling with GSAP 3.15 for timeline scrubbing, pointer dragging, and smooth spring physics.

---

## 4. Technology Stack & Dependencies

### 4.1 Production Dependencies
- **React (`^19.2.8`) & React DOM (`^19.2.8`):** UI component rendering and concurrent features.
- **GSAP (`^3.15.0`):** Timeline orchestration, smooth tweening, and dragging physics.
- **@tailwindcss/vite (`^4.3.3`) & Tailwind CSS (`^4.3.3`):** Zero-config modern styling framework.

### 4.2 Developer Dependencies
- **Vite (`^8.3.0`):** Ultra-fast ESM development server and bundler.
- **TypeScript (`~6.0.2`):** Type safety across components, geometry math, and memory models.
- **Oxlint (`^1.81.0`):** High-performance Rust-based linter for code health.
- **PostCSS (`^8.5.28`) & Autoprefixer (`^10.6.1`):** Cross-browser CSS transformations.

---

## 5. Architecture Decisions Log

| Decision ID | Area | Choice | Justification |
| :--- | :--- | :--- | :--- |
| **ARCH-101** | Frontend Router | Single-Page Smooth Scroll + Story Context | Eliminates page reload interruptions; preserves Canvas WebGL/2D contexts |
| **ARCH-102** | State Management | React Context + Custom Reducer | Lightweight, avoids third-party state bloat while providing reactive HUD state |
| **ARCH-103** | Memory Storage | Hybrid Redis + Vector DB (Qdrant) + Postgres | Redis for sub-millisecond turn buffers; Qdrant for semantic recall; Postgres for audit |
| **ARCH-104** | AI Routing | Capability Tiered Routing (Gemini Flash -> Claude Sonnet) | Minimizes latency and API expenditure without sacrificing poetic generation quality |

---

## 6. Known Problems & Technical Debt

1. **Audio Autoplay Policy:** Web browsers block `AudioContext` until explicit user interaction. Handled via `SoundToggle` component and muted default state, but requires explicit first click.
2. **Device Pixel Ratio Scaling on High-DPI Displays:** Canvas dimensions require careful sync with `window.devicePixelRatio` during orientation flips on mobile tablets.
3. **Drift Calibration in Narrative Generation:** Long creative storytelling can drift from the user's specific emotional premise; solved by MemoryOS auto-heal triggers.
4. **Context Pruning Boundary:** Balancing token efficiency against retaining emotional nuance in user memories.

---

## 7. Roadmap

### Phase 1: Interactive Foundation (Completed ✅)
- [x] Procedural 16-stage canvas heart tree growth
- [x] Web Audio API procedural sound engine
- [x] Draggable Wish section and interactive Love Letter
- [x] Responsive layout and story timeline scrubber

### Phase 2: MemoryOS Architecture Integration (Current 🚀)
- [x] Establish `/docs`, `/architecture`, and `/memory` directories
- [x] Structure 6 memory layers: User, Project, Conversation, Agent, Codebase, Knowledge Graph
- [x] Implement MemoryOS drift detection formula and auto-heal rules
- [x] Define multi-model smart router and gateway architecture

### Phase 3: AI-Powered Emotion & Narrative Generation (Next 📅)
- [ ] Connect Wish input form to LangGraph agent for personalized story poem generation
- [ ] Connect Love Letter to Gemini/Claude streaming endpoint with custom tone sliders
- [ ] Dynamic canvas visual updates based on sentiment analysis (colors, leaf density, wind speed)

### Phase 4: Collaborative Wishes & Community Constellation
- [ ] Real-time WebSocket sync bus allowing multiple users to release wishes together
- [ ] Persistent global wish galaxy rendered in 3D WebGL

---

## 8. Changelog

- **v1.2.0 (2026-09-20):**
  - Integrated complete MemoryOS 6-layer memory architecture.
  - Added `/docs` and `/architecture` technical blueprints.
  - Configured drift detection algorithms and auto-healing specifications.
- **v1.1.0 (2026-09-18):**
  - Added interactive wish application components and story context (`1f6d137`).
  - Rewrote `FullBloom` component with typed static hearts and pure rendering (`c10929e`).
- **v1.0.0 (2026-09-15):**
  - Added cinematic experience, HUD controls, navigation, and Web Audio engine (`9bf6a09`).
  - Initialized LoveExperience module with 16-stage procedural tree growth (`e63dc78`).
