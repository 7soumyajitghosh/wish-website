# Codebase Memory 🔍

> **Project Wish AI — Comprehensive Codebase Map & Entity Registry**  
> *Repository: `7soumyajitghosh/wish-website`*  
> *Target Framework: React 19 + TypeScript + Vite + Tailwind CSS + GSAP + Web Audio*  
> *Last Synced: 2026-09-20*

---

## 1. Repository Structure Overview

```
wish-website/
├── .git/                                 # Git version control metadata
├── .github/                              # CI/CD workflows and actions
├── .oxlintrc.json                        # Oxlint static code analyzer config
├── architecture/                         # Architecture specifications & blueprints
│   ├── database.md                       # PostgreSQL, Redis, Qdrant, Neo4j schemas
│   ├── security.md                       # Authentication, encryption, guardrails
│   ├── services.md                       # Microservices and component contracts
│   └── system.md                         # Detailed system component breakdown
├── docs/                                 # Comprehensive project and memory docs
│   ├── AGENT_MEMORY.md                   # Agent runtime, state, and drift tracking
│   ├── ARCHITECTURE.md                   # System topology, data flow, sequence
│   ├── CODEBASE_MEMORY.md                # This codebase map and symbol index
│   ├── DATA_FLOW.md                      # Detailed data lifecycle and pipelines
│   ├── MODEL_ROUTING.md                  # Smart Model Router and fallback rules
│   └── PROJECT_MEMORY.md                 # Goals, status, ADRs, roadmap, changelog
├── memory/                               # MemoryOS persistent layers & engine
│   ├── agent_memory.json                 # Agent states, reflections, heal logs
│   ├── codebase_memory.json              # Machine-readable AST index of codebase
│   ├── conversation_memory.json          # Multi-turn dialogue sliding buffers
│   ├── index.ts                          # Memory system entry barrel
│   ├── knowledge_graph.json              # Entity-relationship semantic triples
│   ├── memoryos.ts                       # MemoryOS TypeScript engine implementation
│   ├── project_memory.json               # Structured project goals and metadata
│   └── user_memory.json                  # User personas, preferences, wish store
├── public/                               # Static assets (favicons, images)
├── screenshots/                          # Visual QA snapshots & storyboard frames
├── src/                                  # Application source code
│   ├── App.tsx                           # Main application layout & story container
│   ├── main.tsx                          # Vite React DOM entry point
│   ├── index.css                         # Global CSS styles & Tailwind directives
│   ├── animation/                        # Canvas math & Bézier curve algorithms
│   │   └── bezierUtils.ts                # Cubic Bézier curve calculation helpers
│   ├── audio/                            # Web Audio API sound synthesizer
│   │   └── soundManager.ts               # Procedural audio generator (drone, bells)
│   ├── context/                          # Global state and milestone coordination
│   │   ├── StoryContext.tsx              # React Context Provider for 16-stage story
│   │   └── storyTypes.ts                 # Stage progress map, descriptions, types
│   └── components/                       # UI and Canvas presentation components
│       ├── CinematicExperience/          # Main viewport wrapping canvas & controls
│       │   └── CinematicExperience.tsx   # Canvas container & timeline controller
│       ├── FinalDestination/             # Stage 16 landing with bench, lamp, sunset
│       │   └── FinalDestination.tsx      # Sunset horizon and destination layout
│       ├── FinalMessage/                 # Revealing poetic closing card
│       │   └── FinalMessage.tsx          # Animated card with emotional poem
│       ├── Footer/                       # Site footer and credits
│       │   └── Footer.tsx                # Romantic footer and repository link
│       ├── FullBloom/                    # Dense heart canopy celebration layer
│       │   └── FullBloom.tsx             # 350+ heart blossom particle layer
│       ├── HeartTreeAnimation/           # 60 FPS Procedural Canvas growth engine
│       │   ├── HeartTreeAnimation.css    # Canvas positioning styles
│       │   ├── HeartTreeAnimation.tsx    # Canvas render loop & resize management
│       │   ├── index.ts                  # Component export
│       │   ├── animation/                # Stage-specific animation sub-timelines
│       │   │   ├── bloomTimeline.ts      # Heart bloom expansion timeline
│       │   │   ├── flightTimeline.ts     # Heart release into the sky timeline
│       │   │   ├── growthTimeline.ts     # Trunk and branch elongation math
│       │   │   └── windTimeline.ts       # Wind physics and petal deflection
│       │   └── tree/                     # Organic geometry generators
│       │       ├── branches.ts           # Recursive branch curvature generators
│       │       ├── heartAnchors.ts       # Heart coordinate anchor points
│       │       ├── roots.ts              # Root filigree procedural geometry
│       │       └── treeGeometry.ts       # Base trunk structure and width taper
│       ├── Hero/                         # Cinematic full-viewport opening
│       │   └── Hero.tsx                  # Dramatic title, subtitle, and CTA
│       ├── Journey/                      # Interactive 16-milestone explorer
│       │   └── Journey.tsx               # Clickable milestone gallery
│       ├── LoveExperience/               # Alternate interactive scene bundle
│       │   ├── LoveExperience.css        # Interactive scene styles
│       │   ├── LoveExperience.tsx        # Scene orchestrator
│       │   ├── index.ts                  # Export
│       │   ├── animation/particleSystem.ts
│       │   ├── config/experienceConfig.ts
│       │   └── scenes/                   # Modular standalone scenes
│       │       ├── ConstellationScene.tsx
│       │       ├── FlowerScene.tsx
│       │       ├── HeartTreeScene.tsx
│       │       ├── LoveLetterScene.tsx
│       │       └── WishScene.tsx
│       ├── LoveLetter/                   # Interactive unfolding love letter
│       │   └── LoveLetter.tsx            # Letter envelope animation & reader
│       ├── Navigation/                   # Glassmorphic top navigation bar
│       │   └── Navigation.tsx            # Responsive navigation & mobile menu
│       ├── SoundToggle/                  # Floating audio control toggle
│       │   └── SoundToggle.tsx           # Speaker icon, mute/unmute trigger
│       └── WishSection/                  # Draggable interactive wish launch
│           └── WishSection.tsx           # Starfield canvas & physics drag heart
├── index.html                            # HTML template with Google Fonts
├── package.json                          # Project dependencies and npm scripts
├── tsconfig.json                         # TypeScript root configuration
├── tsconfig.app.json                     # TypeScript application configuration
├── tsconfig.node.json                    # TypeScript Node build configuration
└── vite.config.ts                        # Vite bundler configuration
```

---

## 2. Core Components Directory & Symbol Registry

### 2.1 Context & State (`src/context/`)
- **`StoryContext.tsx`**:
  - `StoryProvider`: Context provider maintaining `isStarted`, `currentStage`, `targetProgress`, `isBloomUnlocked`, `isFlightUnlocked`, `activeTreeQuote`, `windVector`, `isLetterOpen`, `isFinalUnlocked`.
  - `useStory()`: Custom consumer hook providing type-safe access to story operations.
- **`storyTypes.ts`**:
  - `STAGE_PROGRESS_MAP`: Normalizes stages 1–16 to normalized float progress `[0.02, 1.00]`.
  - `STAGE_DESCRIPTIONS`: Typed dictionary containing titles and poetic subtitles for all 16 narrative phases.
  - `TreeQuote`, `WindVector`, `StoryContextType`: Core state interfaces.

### 2.2 Procedural Audio Subsystem (`src/audio/`)
- **`soundManager.ts`**:
  - `class SoundManager`: Web Audio API procedural synthesizer.
  - `startAmbient()`: Spawns 5 oscillators tuned to romantic Cmaj7/9 frequencies:
    - C3 (130.81 Hz), G3 (196.00 Hz), B3 (246.94 Hz), E4 (329.63 Hz), G4 (392.00 Hz).
  - `playBloomChime()`: High-frequency crystalline sine tone with gentle decay.
  - `playHeartbeatPulse()`: Low-frequency sub-bass pulse simulating a biological heartbeat.
  - `playWindSwoosh()`: Band-pass filtered white noise burst simulating evening breeze.
  - `toggleMute()` / `setMuted(boolean)`: State toggling.

### 2.3 Canvas & Procedural Tree Subsystem (`src/components/HeartTreeAnimation/`)
- **`HeartTreeAnimation.tsx`**:
  - Encapsulates the main `<canvas>` element.
  - Controls requestAnimationFrame loop running at 60 FPS.
  - Handles high-DPI scaling via `window.devicePixelRatio`.
- **`tree/treeGeometry.ts` & `tree/branches.ts`**:
  - Computes cubic Bézier paths: $B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3$.
  - Generates organic bark texture, branch splits, and twig tapers.
- **`tree/heartAnchors.ts` & `FullBloom.tsx`**:
  - Manages spatial coordinates for 350+ heart leaves in shades of ruby, blush, rose, and gold.

### 2.4 Interactive Experience Components
- **`WishSection.tsx`**:
  - Starfield background canvas with 45 twinkling stars.
  - Pointer event handlers (`handlePointerDown`, `handlePointerMove`, `handlePointerUp`) for dragging glowing heart wishes.
  - Heart trajectory calculation launching wishes toward the glowing Heart-Sun in the upper hemisphere.
- **`LoveLetter.tsx`**:
  - Interactive envelope with 3D opening animation.
  - Formatted romantic stationery with serif calligraphy styling.
- **`FinalDestination.tsx`**:
  - Stage 16 climactic scenery rendering the sunset horizon, Victorian streetlamp, cozy garden bench, and glowing flower pathway.
- **`Journey.tsx`**:
  - Interactive 16-milestone timeline explorer with thumbnail previews and progress jumping.

---

## 3. Dependencies & Version Constraints

```json
{
  "production": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "gsap": "^3.15.0",
    "@tailwindcss/vite": "^4.3.3"
  },
  "devDependencies": {
    "vite": "^8.3.0",
    "typescript": "~6.0.2",
    "oxlint": "^1.81.0",
    "tailwindcss": "^4.3.3",
    "postcss": "^8.5.28",
    "autoprefixer": "^10.6.1",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "@types/node": "^24.13.3"
  }
}
```

---

## 4. API Endpoints & Contracts (AI Backend Integration)

| Route | Method | Payload / Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/wish/submit` | `POST` | `{ userId: string, text: string, mood?: string }` | `{ wishId: string, trajectory: object, promptRef: string }` | Submits a wish; logs to Postgres and User Memory |
| `/api/v1/letter/generate` | `POST` | `{ tone: string, recipient: string, memories: string[] }` | `ReadableStream<SSE>` | Streams personalized letter generated via Model Gateway |
| `/api/v1/agent/drift` | `GET` | `{ sessionId: string }` | `{ driftScore: number, status: "healthy" \| "drifted", healEvents: number }` | MemoryOS drift check endpoint |
| `/api/v1/memory/sync` | `POST` | `{ agentId: string, patch: MemoryPatch }` | `{ status: "synced", version: number }` | Synchronizes agent state to multi-agent bus |

---

## 5. Database Schemas (Conceptual Blueprint)

### 5.1 Relational Schema (PostgreSQL)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB DEFAULT '{}'
);

CREATE TABLE wishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wish_text TEXT NOT NULL,
    sentiment_score REAL,
    stage_id INT NOT NULL DEFAULT 16,
    released_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    vector_id VARCHAR(64)
);

CREATE TABLE memoryos_heal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(128) NOT NULL,
    drift_score REAL NOT NULL,
    pruned_memory_count INT NOT NULL,
    re_injected_keys TEXT[] NOT NULL,
    healed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5.2 Vector Index Schema (Qdrant / FAISS)
- **Collection Name:** `wish_memory_embeddings`
- **Vector Dimension:** 1536 (OpenAI `text-embedding-3-small` or 768 for Gemini `text-embedding-004`)
- **Distance Metric:** Cosine Similarity
- **Payload Fields:**
  - `memory_id` (string)
  - `layer` (`user` | `project` | `conversation` | `agent` | `codebase` | `knowledge`)
  - `importance` (float: 0.0 - 1.0)
  - `created_timestamp` (epoch ms)
  - `tags` (string array)

---

## 6. Recent Code Changes Log

1. **`1f6d137` - feat: add interactive wish application components and story context**
   - Added `src/components/WishSection/WishSection.tsx` with starfield and draggable physics.
   - Introduced `src/context/StoryContext.tsx` and `src/context/storyTypes.ts`.
2. **`c10929e` - fix(FullBloom): clean rewrite with typed static hearts and pure render**
   - Eliminated jitter during stage 12 transition by stabilizing heart coordinate seeds.
3. **`9bf6a09` - Add cinematic experience, UI components, audio**
   - Added procedural Web Audio engine `src/audio/soundManager.ts`.
   - Created `Hero`, `Navigation`, `LoveLetter`, and `FinalDestination` components.
4. **`e63dc78` - feat: add LoveExperience module with interactive scenes and HeartTree animation**
   - Implemented canvas procedural branch curvature and roots in `src/components/HeartTreeAnimation/`.
