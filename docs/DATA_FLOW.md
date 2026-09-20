# End-to-End Data Flow & Lifecycle 🌊

> **Project Wish AI — Comprehensive Data Flow Specifications**  
> *Target Repository: `7soumyajitghosh/wish-website`*  
> *Memory Architecture: MemoryOS Self-Healing Framework*

---

## 1. End-to-End Pipeline Overview

The data flow in Project Wish AI spans client-side gesture capture (mouse dragging, wish submission, audio control), API routing, agentic state orchestration, multi-layer memory retrieval and ingestion, model arbitration, tool execution, and real-time streaming back to the DOM and Canvas layers.

```
┌──────────────┐
│  1. USER     │ ── (Gesture / Wish / Story Scrub)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 2. FRONTEND  │ ── (React 19 + Canvas + Web Audio)
└──────┬───────┘
       │ HTTPS / WSS / SSE
       ▼
┌──────────────┐
│ 3. API GATE  │ ── (Fastify Gateway: JWT Auth, Rate Limiter, Schema Validation)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 4. ORCHESTR. │ ── (LangGraph StateGraph Engine: Dispatches to Active Subgraph)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 5. CTX MGR   │ ── (Calculates drift, evaluates token budget, prunes stale turns)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 6. MEM RETR. │ ── (Queries Redis Cache, Qdrant Vectors, Neo4j Entity Triples)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 7. ROUTER    │ ── (Smart Model Router: Cost, Latency, Capability Matcher)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 8. PROVIDER  │ ── (Gemini 2.0 Flash / Claude 3.5 Sonnet / GPT-4o / Ollama)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 9. TOOL RUN  │ ── (Sandboxed execution: Canvas Palette, Web Audio Tuner)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 10. MEM UPD. │ ── (Decay Calculation, Drift Evaluation, Auto-Heal Trigger)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 11. RESPONSE │ ── (SSE Stream to Frontend -> DOM update, Canvas Physics, Sound)
└──────────────┘
```

---

## 2. Step-by-Step Data Flow Breakdown

### Step 1: User Gesture & Interaction Input
- The user interacts with one of the primary UI entry points in `wish-website`:
  - **Draggable Wish Submission:** User types a personal wish in `WishSection.tsx`, clicks "Create Wish Heart", and drags the heart across the screen toward the twilight sunset.
  - **Love Letter Interaction:** User clicks to open the sealed wax envelope in `LoveLetter.tsx` or requests an AI-generated poem.
  - **Milestone Navigation:** User scrubs the 16-stage timeline in `CinematicExperience.tsx` or clicks milestone cards in `Journey.tsx`.
- **Payload at Origin:**
  ```json
  {
    "action": "RELEASE_WISH",
    "userId": "usr_9981",
    "stageId": 16,
    "payload": {
      "text": "I hope our paths intertwine under the evening stars forever.",
      "releaseCoordinates": { "x": 620, "y": 240 }
    }
  }
  ```

### Step 2: Frontend State Dispatch & Local Optimistic Update
- `WishSection.tsx` instantly launches a glowing flying heart toward the Heart Sun using local GSAP tweening and spawns particle trails on the canvas.
- Simultaneously, `soundManager.ts` plays a soft bloom bell chime (`playBloomChime()`).
- The interaction payload is bundled into an asynchronous fetch request with JWT authentication headers sent to `/api/v1/interaction`.

### Step 3: API Gateway Ingress & Validation
- **Authentication:** Ingress verifies Bearer JWT token against Redis session registry.
- **Rate Limiting:** Token-bucket algorithm (maximum 60 requests/minute per IP/User).
- **Schema Validation:** Zod validator checks that `text` length is between 2 and 500 characters and coordinates are non-negative.
- Valid requests are assigned a unique `traceId` (e.g. `trc_ae48f0`) and forwarded to the Orchestrator via gRPC/internal HTTP.

### Step 4: LangGraph Orchestrator Dispatch
- LangGraph initializes or resumes an active `StateGraph` tied to `sessionId`.
- State is loaded from the LangGraph checkpointer (PostgreSQL/Redis).
- The state determines whether this turn requires narrative expansion, visual parameter changes, or direct responses.

### Step 5: Context Manager & Token Pruner
- The Context Manager checks active token capacity against the model target:
  - Total Target Budget: 4,000 tokens (for sub-500ms latency).
  - Reserved for System Prompt: 800 tokens.
  - Reserved for Dynamic Memory: 1,500 tokens.
  - Reserved for Tool Signatures & Scratchpad: 700 tokens.
  - Reserved for Output Generation: 1,000 tokens.
- Stale conversation items with low relevance scores ($\text{relevance} < 0.25$) are pruned from the immediate prompt window.

### Step 6: MemoryOS 6-Layer Memory Retrieval
MemoryOS parallelizes retrieval across four stores:
1. **User Memory:** Retrieves user tone profile (e.g., "poetic, reflective, gentle") and past favorite wishes.
2. **Project Memory:** Pulls current technical constraints (e.g., Stage 16 is "Where Love Takes Flight", heart tree has reached full bloom).
3. **Conversation Memory:** Retrieves the last 5 turns from the Redis sliding window buffer.
4. **Knowledge Graph (Neo4j):** Executes Cypher query matching semantic triples:
   ```cypher
   MATCH (w:WishType {name: "devotion"})-[:EVOKES]->(e:Emotion)-[:MAPS_TO]->(c:CanvasPalette)
   RETURN e.sentiment, c.primaryGlowHex, c.audioFrequency
   ```
5. **Vector Store (Qdrant):** Computes cosine similarity against vectorized memories to find semantically related previous wishes.

### Step 7: Smart Model Routing Decision
- The Smart Model Router parses the task requirements:
  - Task: Emotional sentiment evaluation + customized poetic wish response.
  - Complexity: Moderate.
  - Latency Requirement: Critical (< 600ms first token).
- **Decision:** Route to **Tier 1 (Gemini 2.0 Flash)**. If response times out (> 1.5s), circuit breaker fails over to **Claude 3.5 Sonnet**.

### Step 8: Model Provider Execution
- Prompt is sent via streaming API:
  - System instructions + MemoryOS context + Knowledge Graph nodes + User input.
- The model outputs streaming JSON/text containing the generated message and structured tool calls (e.g., `setCanvasAtmosphere()`).

### Step 9: Agent Tool Execution Runtime
- The Orchestrator receives tool invocation directives from the model:
  - Tool: `tuneVisualAesthetics(bloomIntensity: 1.4, twilightTint: "#ff7b90")`
  - Tool: `synthesizeHarmonics(rootFreq: 196.00, mode: "peaceful_warm")`
- Tools execute inside a sandboxed runtime, producing structured output objects.

### Step 10: MemoryOS Ingestion, Drift Evaluation & Auto-Heal
1. **Ingestion:** The new wish, model response, and sentiment metrics are appended to the Conversation Buffer.
2. **Decay Engine:** Temporal decay is applied across all active short-term memories:
   $$\text{relevance}(m, t) = \text{importance}(m) \times e^{-0.05 \times \Delta t}$$
3. **Drift Detection:** Cosine similarity against baseline vector $v_{\text{baseline}}$ is evaluated.
   - If $\text{drift}(t) \ge 0.45$: Auto-Heal routine triggers immediately, pruning stale entries, re-anchoring core system axioms, and logging the event in `memory/agent_memory.json`.
4. **Persistence:** State changes are synchronized to the MemoryOS Sync Bus.

### Step 11: Response Streaming & Frontend Reconciliation
- The API Gateway streams Server-Sent Events (SSE) back to the browser:
  - Event `text-delta`: Delivers typed letters for the Love Letter or toast notification.
  - Event `canvas-patch`: Instructs `HeartTreeAnimation` to dynamically adjust branch luminescence and heart particle velocities.
  - Event `audio-patch`: Instructs `soundManager.ts` to modulate ambient filter cutoffs.
- The UI gracefully renders updates at 60 FPS without interrupting the background canvas animations.
