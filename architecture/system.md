# System Architecture Blueprint 🏗️

> **Project Wish AI — Comprehensive System Specification**  
> *Target Repository: `7soumyajitghosh/wish-website`*  
> *Standard: MemoryOS Self-Healing Architecture*

---

## 1. High-Level Architectural Topography

Project Wish AI is structured as a cloud-native, real-time interactive system composed of three primary operational tiers:
1. **Client Experience Layer:** High-performance React 19 single-page application executing client-side 60 FPS HTML5 Canvas physics, Web Audio API procedural sound generation, and glassmorphic UI controls.
2. **Agentic Orchestration & Gateway Layer:** Fastify/FastAPI gateway coupled with a LangGraph state machine orchestrator, managing context assembly, token pruning, dynamic model arbitration, and sandboxed tool execution.
3. **MemoryOS & Storage Infrastructure:** Multi-tier persistent memory tier combining Redis (sub-millisecond sliding windows and sync bus), PostgreSQL (audit logs and user entities), Qdrant (dense vector embeddings), and Neo4j (semantic knowledge graphs).

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          CLIENT EXPERIENCE LAYER                          │
│  React 19  •  Vite 8  •  Tailwind CSS v4  •  HTML5 Canvas  •  Web Audio   │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ HTTPS / WSS / SSE
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                      GATEWAY & ORCHESTRATION LAYER                        │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌─────────────────────┐ │
│ │     API Gateway      │ │ LangGraph Orchestr.  │ │   Context Manager   │ │
│ │ (Fastify/RateLimit)  │ │ (StateGraph Engine)  │ │ (Pruning / Decay)   │ │
│ └──────────┬───────────┘ └──────────┬───────────┘ └──────────┬──────────┘ │
│            └────────────────────────┼────────────────────────┘            │
│                                     ▼                                     │
│ ┌───────────────────────────────────────────────────────────────────────┐ │
│ │                      SMART MODEL ROUTER & GATEWAY                     │ │
│ │   Gemini 2.0 Flash   •   Claude 3.5 Sonnet   •   GPT-4o   •   Ollama  │ │
│ └───────────────────────────────────┬───────────────────────────────────┘ │
└─────────────────────────────────────┼─────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                    MEMORYOS MULTI-LAYER STORAGE TIER                      │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────────┐ │
│ │  Redis Cache  │ │  PostgreSQL   │ │ Qdrant Vector │ │ Neo4j Knowledge │ │
│ │ (Sliding/Bus) │ │(Users/Wishes) │ │ (Embeddings)  │ │     (Graph)     │ │
│ └───────────────┘ └───────────────┘ └───────────────┘ └─────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Component Breakdown

### 2.1 Frontend Subsystem
- **Runtime:** Browser DOM & WebGL/Canvas2D contexts.
- **Components:**
  - `Hero.tsx`: Entry portal with title and atmospheric lighting.
  - `CinematicExperience.tsx`: Encapsulates the 16-stage interactive narrative.
  - `HeartTreeAnimation.tsx`: Canvas 2D engine with organic trunk growth, cubic Bézier branch curvature, and dynamic radial sunset illumination.
  - `soundManager.ts`: Web Audio API procedural synthesizer producing ambient Cmaj7/9 chord drones, blooming chimes, and heartbeat sub-pulses.
  - `LoveLetter.tsx`: Interactive envelope with 3D folding animation and romantic serif typography.
  - `WishSection.tsx`: Draggable heart physics launcher with starfield backdrop.
  - `Journey.tsx`: 16-stage milestone scrubber and visual inspector.

### 2.2 API Gateway Subsystem
- **Technology:** Fastify (Node.js) or FastAPI (Python) reverse proxy.
- **Functions:**
  - SSL/TLS 1.3 termination and HTTP/2 connection pooling.
  - JWT authorization and API key verification.
  - Token-bucket rate limiting (60 req/min per client).
  - Server-Sent Events (SSE) multiplexing for real-time letter typing and canvas parameter streaming.

### 2.3 Orchestrator Subsystem
- **Engine:** LangGraph StateGraph.
- **Execution Flow:**
  - Manages cyclic agent execution loops (Plan -> Act -> Observe -> Reflect).
  - Maintains execution checkpoints in Redis/PostgreSQL for long-running sessions.
  - Coordinates specialized subagents: Poetic Muse Agent, Canvas Shaper Agent, Harmonic Tuner Agent, and MemoryOS Guardian Agent.

### 2.4 Context Management Subsystem
- **Responsibilities:**
  - Dynamic token allocation within model-specific budgets.
  - Memory decay computation using the exponential decay law:
    $$\text{relevance}(m, t) = \text{importance}(m) \times e^{-\lambda \times \Delta t}$$
  - Prunes low-relevance memories to keep active prompt payloads concise and focused.
  - Assembles unified context payloads combining user sentiment, project constraints, recent conversation, and graph triples.

### 2.5 Smart Model Router & Model Providers
- **Provider Gateway:**
  - **Gemini 2.0 Flash:** Primary for low-latency tasks (< 400ms), visual parameter adjustments, sentiment evaluation.
  - **Claude 3.5 Sonnet:** Primary for creative, high-lyricism tasks (Love Letters, philosophical story narration).
  - **GPT-4o:** Complex tool execution and Knowledge Graph entity extraction.
  - **Ollama (Llama 3.3 70B / Mistral):** Air-gapped and local fallback execution.
- **Failover:** Circuit breaker pattern tripping on 3 consecutive errors or timeouts; automatic transparent fallback to secondary models.

### 2.6 Agent Runtime & MemoryOS Self-Healing Subsystem
- **Drift Detection:** Cosine similarity comparison between baseline intent vector and active conversation vector:
  $$\text{drift}(t) = 1 - \frac{v_{\text{baseline}} \cdot v_{\text{current}}}{\|v_{\text{baseline}}\| \|v_{\text{current}}\|}$$
- **Auto-Heal Trigger:** When $\text{drift}(t) \ge 0.45$:
  - Prune lowest-relevance memories.
  - Re-inject top-3 foundational anchor memories.
  - Reset agent trajectory and log heal event to `memory/agent_memory.json`.
- **Multi-Agent Sync Bus:** Redis Pub/Sub channel distributing memory updates across agents in real time.

### 2.7 Tool Runtime Subsystem
- **Sandbox:** Node.js worker threads or WebAssembly sandboxes.
- **Tools:**
  - `generateColorPalette(mood: string)`: Computes RGBA hex codes for radial gradient canopy lighting.
  - `tuneAudioHarmonics(sentiment: string)`: Modulates Web Audio oscillator frequencies and filter cutoffs.
  - `formatWishEntity(wishText: string)`: Formats wishes into canvas particle trajectory vectors.
  - `queryKnowledgeTriples(entity: string)`: Cypher query execution on Neo4j.

### 2.8 Storage & Database Subsystem
- **PostgreSQL:** ACID relational store for user profiles, persistent wishes, and transaction audit trails.
- **Redis:** High-throughput in-memory store for active session buffers, sync bus, and rate limiter tokens.
- **Qdrant:** Vector database indexing dense embeddings for semantic retrieval across memories.
- **Neo4j:** Graph database storing narrative, emotional, and visual semantic triples.

---

## 3. Communication Protocols & Interfaces

| Link | Protocol | Format | Latency Target |
| :--- | :--- | :--- | :--- |
| **Frontend <-> Gateway** | HTTPS / HTTP/2 | JSON / Multipart | < 50ms |
| **Gateway <-> Frontend (Stream)** | SSE (Server-Sent Events) | Text Stream Chunks | < 20ms per chunk |
| **Gateway <-> Orchestrator** | gRPC / Internal HTTP | Protobuf / JSON | < 10ms |
| **Orchestrator <-> Redis** | Redis Protocol (RESP) | Binary / String | < 2ms |
| **Orchestrator <-> Model Providers**| HTTPS / TLS 1.3 | JSON Streaming | 250ms - 800ms TTFT |
| **Orchestrator <-> Qdrant** | gRPC / REST | Vector arrays / JSON | < 25ms |
| **Orchestrator <-> Neo4j** | Bolt Protocol | Cypher queries / JSON | < 30ms |

---

## 4. Scalability, Redundancy & Fault Tolerance

1. **Stateless API Gateway:** Can horizontally scale across multiple Kubernetes pods behind an Application Load Balancer.
2. **Distributed Checkpointing:** LangGraph state is stored centrally in Redis and PostgreSQL, allowing agent tasks to resume seamlessly on any worker pod.
3. **Database Read Replicas:** PostgreSQL read replicas and Redis clustering ensure high availability during peak user traffic.
4. **Resilient Client Decoupling:** The browser Canvas and Web Audio engine run completely independently of network hiccups; if backend generation lags, procedural animation continues smoothly at 60 FPS.
