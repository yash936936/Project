# TRD — AI System Design Assistant

## System Architecture Layers

### Frontend
Single-page app with a canvas-first layout. Diagram rendering, document view, and chat panel coexist in a split-pane layout. Must support streaming partial updates without full re-render.

| Concern | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Diagram rendering | React Flow / Mermaid.js |
| State management | Zustand |
| Styling | Tailwind CSS |
| Document editor | Tiptap |
| Export | html2canvas + jsPDF |

---

### Backend / API Layer
Stateless API layer that orchestrates the 7-stage generation pipeline. Supports streaming responses via SSE. Manages prompt context objects and persists generation sessions.

| Concern | Technology |
|---|---|
| Runtime | Node.js + Fastify |
| LLM orchestration | LangChain.js |
| Streaming | Server-Sent Events (SSE) |
| Queue | BullMQ (Redis-backed) |
| Auth | Clerk / NextAuth |

---

### AI / LLM Layer
Each of the 7 pipeline stages calls a purpose-built structured prompt with JSON output mode. Prompts are versioned and stored as templates. Uses function-calling to produce typed output for each stage.

| Concern | Technology |
|---|---|
| Primary model | Claude Sonnet (Anthropic API) |
| Fallback model | GPT-4o |
| Output mode | Structured JSON (tool_use) |
| Prompt store | Langfuse / PromptLayer |
| Evals | Custom test harness |

---

### Data Persistence
Lightweight relational store for user accounts and session metadata. Diagram and document JSON stored in object storage for cost efficiency. Redis for session caching and job queues.

| Concern | Technology |
|---|---|
| Primary DB | PostgreSQL (Supabase) |
| Object storage | S3 / Cloudflare R2 |
| Cache / Queue | Redis (Upstash) |
| ORM | Drizzle ORM |

---

## Core API Contracts

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate` | Initiate generation from prompt. Returns a `session_id` and opens an SSE stream. |
| `GET` | `/api/generate/:id/stream` | SSE endpoint — emits stage events: `{stage, status, payload}` for each of 7 stages. |
| `GET` | `/api/sessions/:id` | Retrieve a full generation result (all stages) for a given session. |
| `PUT` | `/api/sessions/:id/stage/:stage` | Regenerate a single stage (e.g. rerun tech-stack) without re-running all stages. |
| `POST` | `/api/sessions/:id/chat` | Ask a follow-up question within the context of a session. Streams response back. |
| `POST` | `/api/sessions/:id/export` | Generate export bundle (PDF/MD/ZIP). Returns signed download URL. |

---

## Database Schema — Key Tables

| Table | Key Columns | Notes |
|---|---|---|
| `users` | `id, email, plan, created_at` | Auth via Clerk; minimal local record |
| `sessions` | `id, user_id, prompt, product_type, scale, status` | One row per generation attempt |
| `stage_outputs` | `session_id, stage, payload_url, tokens_used, duration_ms` | Payload stored in R2; URL here |
| `exports` | `id, session_id, format, download_url, expires_at` | Signed URLs expire after 24 hours |
| `usage_events` | `user_id, event, tokens, cost_usd, ts` | Billing ledger and rate limiting |

---

## Security & Compliance

| Concern | Approach |
|---|---|
| Authentication | JWT via Clerk; refresh tokens rotated every 15 min. PKCE for OAuth flows. |
| Prompt injection | Input sanitisation layer before LLM call. System prompt pinned, user content clearly delimited. |
| Data privacy | User prompts not used for model training. Prompts purged after 90 days (configurable). No PII stored in logs. |
| Rate limiting | 5 generations/hour free, 60/hour pro. Token-bucket algorithm via Upstash Redis. |
| API keys | Anthropic API key stored in environment vault (Infisical / AWS Secrets Manager). Never sent to client. |
| Export links | Pre-signed S3/R2 URLs with 24-hour TTL. No public buckets. |

---

## Performance & Scalability Targets

> The most latency-sensitive operation is stage 1–3 (classify → architecture → flows). These must stream within 3 seconds of first token. Total end-to-end (all 7 stages) should complete in under 45 seconds on a cold start.

| SLO | Target | Mechanism |
|---|---|---|
| Time to first diagram token | < 3s (P95) | Streaming SSE + fast model routing |
| Full generation (7 stages) | < 45s (P90) | Parallel stage execution where safe |
| API response (non-LLM) | < 200ms (P99) | Edge-deployed API routes (Vercel/Cloudflare) |
| Export generation | < 10s | Background job; notify user on ready |
| Uptime | 99.5% | Multi-region deployment; LLM fallback model |
| Concurrent users (v1) | 500 concurrent sessions | Queue jobs above threshold; horizontal pod scaling |

---

## Infrastructure & Deployment

| Layer | Platform | Notes |
|---|---|---|
| Frontend hosting | Vercel | Edge-deployed Next.js. CDN for static assets, ISR for public pages. |
| API hosting | Railway or Fly.io | Containerised Node.js. Auto-scales on CPU and queue depth. |
| Database | Supabase (Postgres) | Connection pooling via PgBouncer. Daily automated backups. |
| Observability | Sentry / PostHog / Langfuse / Grafana | Errors, product analytics, LLM tracing, infra metrics respectively. |
