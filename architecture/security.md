# Security, Authentication & Governance Blueprint 🛡️

> **Project Wish AI — Security Architecture & Threat Mitigation**  
> *Target Repository: `7soumyajitghosh/wish-website`*  
> *Security Posture: Zero-Trust Defense-in-Depth*

---

## 1. Threat Model & Security Scope

As an AI-driven, interactive personal sentiment platform, Project Wish processes deeply personal user input (romantic wishes, intimate letters, emotional reflections). The security architecture must prevent:
1. **Prompt Injection & Jailbreaks:** Manipulating the model to produce inappropriate content or leak internal system instructions.
2. **Context Leakage & Cross-Tenant Contamination:** Leaking one user's private memories or wishes to another session.
3. **Denial of Service (DoS):** Exhausting expensive LLM token quotas or GPU compute through automated abuse.
4. **Data Tampering & Interception:** Eavesdropping on sentimental communications in transit or at rest.

---

## 2. Authentication & Authorization

```
┌──────────────┐         1. Authenticate (OAuth2 / PKCE)         ┌──────────────┐
│  Client App  │ ──────────────────────────────────────────────> │ Ingress Auth │
│ (React DOM)  │ <────────────────────────────────────────────── │ Gateway      │
└──────┬───────┘         2. Issue Short-Lived JWT + Cookie       └──────┬───────┘
       │                                                                │
       │ 3. API Calls with Bearer Token                                 │ 4. Verify
       ▼                                                                ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND MICROSERVICES TIER                          │
│     Role-Based Access Control (RBAC)  •  Tenant Isolation  •  mTLS Inter-Mesh │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Token Lifecycle
- **Access Tokens:** Signed using Ed25519 / RS256 with an ephemeral 15-minute lifespan.
- **Refresh Tokens:** Stored in secure, HTTP-only, SameSite=Strict cookies with 7-day rotation.
- **Revocation:** Immediate token invalidation via Redis blocklist upon logout or suspicious drift.

### 2.2 Role-Based Access Control (RBAC)
- `Role: Anonymous` $\implies$ Can view static tree stages, scrub timeline, play audio, and submit transient wishes.
- `Role: User` $\implies$ Can persist wishes, unlock personalized AI love letters, save journey milestones, and access private User Memory.
- `Role: Admin / Auditor` $\implies$ Can inspect MemoryOS drift logs, view system health dashboards, and calibrate auto-heal thresholds.

---

## 3. AI Safety Guardrails & Input Sanitation

Every prompt dispatched to model providers passes through a multi-stage safety pipeline:

```
User Input
    ↓
1. Syntax & Schema Validation (Zod: Max length, character checks)
    ↓
2. PII Sanitizer & Masking (Redacts emails, phone numbers, addresses)
    ↓
3. Prompt Injection Defense (Llama-Guard / RegEx injection heuristics)
    ↓
4. MemoryOS Context Assembly (Enforces system prompt immutability)
    ↓
Model Execution
    ↓
5. Output Toxicity & Sentiment Filter (Ensures romantic, wholesome tone)
    ↓
Response Streamed to Client
```

### 3.1 Prompt Injection Heuristics
- Blocks common jailbreak phrases ("ignore previous instructions", "system override", "DAN mode").
- Delimits user inputs using secure XML boundaries:
  ```
  <user_input_untrusted>
  ${sanitizedInput}
  </user_input_untrusted>
  ```
- Explicit system prompt instructions instructing models to treat content within `<user_input_untrusted>` purely as narrative text, never as commands.

---

## 4. Cryptographic Standards & Data Protection

### 4.1 Encryption in Transit
- Mandatory **TLS 1.3** across all public endpoints with HSTS (HTTP Strict Transport Security) enabled.
- Inter-service communication inside the cluster secured via **mTLS** (Mutual TLS) managed by Istio / Envoy service mesh.

### 4.2 Encryption at Rest
- Database volumes (PostgreSQL, Qdrant, Redis) encrypted using **AES-256-GCM**.
- User memory payloads containing personal letters or wishes are individually field-level encrypted using envelope encryption (KMS master key).

---

## 5. Rate Limiting & Denial of Service Defense

To safeguard LLM operational costs and server availability, rate limiting is implemented at the Ingress Gateway:

| Request Class | Rate Limit (Anonymous) | Rate Limit (Authenticated) | Window |
| :--- | :--- | :--- | :--- |
| **General Navigation / Assets** | 120 requests | 300 requests | 1 minute |
| **Draggable Wish Submission** | 5 requests | 20 requests | 1 minute |
| **AI Love Letter Composition** | 1 request | 5 requests | 1 minute |
| **Memory Drift Diagnostic** | 0 requests | 10 requests | 1 minute |

---

## 6. Sandboxed Agent Tool Execution

- Tools invoked by AI agents (e.g. `calculateBezierTaper`, `evaluateSentimentHarmonics`) run inside isolated Worker Threads with restricted system capabilities:
  - **No File System Access:** Workers cannot read or write to the host filesystem.
  - **No Network Ingress/Egress:** Workers cannot make outbound HTTP calls.
  - **Execution Timeout:** Strict 500ms ceiling before thread termination.
