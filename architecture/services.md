# Microservices Architecture & Component Contracts ⚙️

> **Project Wish AI — Service Topology, Interfaces & RPC Specifications**  
> *Target Repository: `7soumyajitghosh/wish-website`*  
> *Standard: MemoryOS Microservices Blueprint*

---

## 1. Service Map & Microservices Breakdown

Project Wish AI is architected around discrete, loosely coupled services communicating via HTTP/2, gRPC, and Redis Pub/Sub:

```
                               ┌───────────────────────────┐
                               │  Client Frontend App      │
                               │  (React 19 / Canvas)      │
                               └─────────────┬─────────────┘
                                             │ HTTPS / WSS
                                             ▼
                               ┌───────────────────────────┐
                               │  Ingress Gateway Service  │
                               │  (Auth, RateLimit, Proxy) │
                               └─────────────┬─────────────┘
                                             │ gRPC
                                             ▼
                               ┌───────────────────────────┐
                               │ LangGraph Orchestrator    │
                               │ Service (Workflow Engine) │
                               └─────────────┬─────────────┘
                      ┌──────────────────────┼──────────────────────┐
                      ▼                      ▼                      ▼
        ┌──────────────────────────┐ ┌───────────────┐ ┌──────────────────────────┐
        │     MemoryOS Service     │ │ Model Gateway │ │ Tool Execution Worker    │
        │ (6 Layers, Drift, Decay) │ │ (Router & LLM)│ │ (Canvas/Audio Generators)│
        └──────────────────────────┘ └───────────────┘ └──────────────────────────┘
```

---

## 2. Service Specifications

### 2.1 Ingress Gateway Service (`svc-gateway`)
- **Port:** `8080` (HTTP/2, HTTPS)
- **Tech Stack:** Fastify (Node.js) + TypeScript
- **Responsibilities:**
  - Ingress point for all browser client requests.
  - TLS termination and CORS policy enforcement.
  - JWT authorization and API token verification.
  - Rate limiting using Redis sliding-window counter.
  - SSE connection management and event broadcasting.
- **Key Routes:**
  - `POST /api/v1/wishes`: Create and submit a wish.
  - `GET /api/v1/wishes/stream`: SSE stream for active wish releases.
  - `POST /api/v1/letters/compose`: Request an AI-generated love letter.
  - `GET /healthz`: Gateway health check probe.

### 2.2 LangGraph Orchestrator Service (`svc-orchestrator`)
- **Port:** `50051` (gRPC)
- **Tech Stack:** Python 3.12 / LangGraph / AsyncIO
- **Responsibilities:**
  - Manages agent state transitions and reasoning cycles.
  - Checkpoints execution state to PostgreSQL and Redis.
  - Coordinates specialized agents:
    - `PoeticMuseAgent`: Lyricism and emotional generation.
    - `CanvasShaperAgent`: Visual canvas color and particle configuration.
    - `HarmonicTunerAgent`: Web Audio synthesizer tuning.
- **gRPC Interface Definition:**
  ```protobuf
  syntax = "proto3";
  package wish.orchestrator;

  service OrchestratorService {
    rpc ExecuteTurn (TurnRequest) returns (stream TurnResponseChunk);
    rpc GetSessionState (SessionStateRequest) returns (SessionStateResponse);
  }

  message TurnRequest {
    string session_id = 1;
    string user_id = 2;
    int32 current_stage = 3;
    string user_input = 4;
    map<string, string> metadata = 5;
  }

  message TurnResponseChunk {
    string chunk_type = 1; // "TEXT_DELTA", "CANVAS_UPDATE", "AUDIO_PARAM"
    string payload_json = 2;
    bool is_final = 3;
  }
  ```

### 2.3 MemoryOS Service (`svc-memoryos`)
- **Port:** `50052` (gRPC / HTTP REST)
- **Tech Stack:** Python / TypeScript (MemoryOS Core)
- **Responsibilities:**
  - Hosts the 6 memory planes: User, Project, Conversation, Agent, Codebase, Knowledge Graph.
  - Computes cosine similarity drift against baseline vectors:
    $$\text{drift}(t) = 1 - \text{cosine\_similarity}(v_{\text{baseline}}, v_{\text{current}})$$
  - Evaluates decay curves: $\text{relevance}(m, t) = \text{importance}(m) \times e^{-\lambda \times \Delta t}$.
  - Triggers automated healing when $\text{drift}(t) \ge 0.45$.
  - Publishes synchronization updates to Redis Pub/Sub.

### 2.4 Smart Model Gateway Service (`svc-model-gateway`)
- **Port:** `50053` (gRPC / Internal HTTP)
- **Tech Stack:** Go / Node.js
- **Responsibilities:**
  - Multi-provider API proxy (Google Gemini, Anthropic Claude, OpenAI, Ollama).
  - Dynamic capability, cost, and latency routing.
  - Circuit breaking and transparent provider fallback.
  - Token quota enforcement and prompt truncation.

### 2.5 Tool Execution Worker Service (`svc-tool-worker`)
- **Port:** `50054` (gRPC)
- **Tech Stack:** Node.js Worker Threads
- **Responsibilities:**
  - Sandboxed execution of procedural math and styling tools.
  - Tools:
    - `calculateBezierTaper(stage: number)`: Computes SVG/Canvas Bézier coordinate arrays.
    - `evaluateSentimentHarmonics(wishText: string)`: Computes base frequencies (e.g. 130.81Hz to 392Hz) for the Web Audio engine.
    - `generateTwilightGradient(sentimentScore: number)`: Computes CSS radial gradients for sunset sky transitions.

---

## 3. Inter-Service Communication & Fault Tolerance

| Origin | Target | Protocol | Timeout | Retry Policy | Fallback Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `svc-gateway` | `svc-orchestrator` | gRPC | 5000ms | 2 retries, exponential backoff | Return 504 with cached narrative prompt |
| `svc-orchestrator` | `svc-memoryos` | gRPC | 1000ms | 1 retry | Proceed with local ephemeral turn memory |
| `svc-orchestrator` | `svc-model-gateway` | gRPC | 8000ms | 0 retries (handled by gateway fallback) | Circuit breaker diverts to Tier 1/Tier 4 |
| `svc-orchestrator` | `svc-tool-worker` | gRPC | 800ms | 1 retry | Return safe default canvas/audio parameters |

---

## 4. Observability & Distributed Tracing

1. **Correlation IDs:** Every client request receives a `X-Correlation-ID` header at the gateway, propagated through all gRPC calls and storage operations.
2. **Metrics:** Prometheus scrapes `/metrics` on all services tracking:
   - `wish_turn_latency_ms`: P50, P90, P99 turn latency.
   - `memoryos_drift_score`: Real-time gauge tracking active agent drift.
   - `memoryos_heal_events_total`: Counter tracking auto-heal triggers.
   - `model_gateway_provider_calls_total`: Model requests categorized by provider and status code.
3. **Logs:** Structured JSON logs shipped to OpenSearch / Loki.
