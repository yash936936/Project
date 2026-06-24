# AI System Design Assistant

Generate complete system design packages from natural language product descriptions via a 7-stage AI pipeline.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Backend | Fastify 4, TypeScript ESM |
| Queue | BullMQ + Redis |
| Database | PostgreSQL via Supabase + Drizzle ORM |
| Storage | Cloudflare R2 |
| LLM Primary | Claude Sonnet 4.6 (Anthropic) |
| LLM Fallback | GPT-4o (OpenAI) |
| Streaming | Server-Sent Events (SSE) via Redis pub/sub |
| Monorepo | Turborepo |

## Monorepo Structure

```
ai-system-design-assistant/
├── apps/
│   ├── web/                  # Next.js 14 frontend
│   │   └── src/
│   │       ├── app/          # App Router pages
│   │       ├── components/   # PipelineProgress, ArtifactViewer
│   │       ├── hooks/        # usePipelineSSE
│   │       └── lib/          # API client
│   └── api/                  # Fastify backend
│       └── src/
│           ├── routes/       # design.ts, health.ts
│           ├── services/     # pipeline.service.ts
│           ├── workers/      # pipeline.worker.ts (BullMQ)
│           ├── lib/          # redis, llm, r2, queue
│           ├── db/           # Drizzle schema + client
│           └── prompts/      # 7-stage prompt templates
└── packages/
    └── shared/               # Types, constants shared across apps
```

## Quick Start

```bash
# 1. Copy env
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, DATABASE_URL, REDIS_URL, R2_* values

# 2. Install deps
npm install

# 3. Run DB migration
npm run db:migrate

# 4. Start everything
npm run dev

# 5. Start the pipeline worker (separate terminal)
cd apps/api && npm run worker
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/v1/designs | Submit new design job |
| GET | /api/v1/designs/:jobId | Poll job status + artifacts |
| GET | /api/v1/designs/:jobId/stream | SSE live stream |
| GET | /api/v1/designs | List recent jobs |
| GET | /api/v1/health | Health check |

## 7-Stage AI Pipeline

```
requirements → architecture → tech_stack → api_design → db_schema → user_flows → prd_trd
```

Each stage:
1. Receives a structured prompt + context from prior stages
2. Streams tokens to the client via SSE (Redis pub/sub)
3. Saves artifact to DB (inline) or R2 (>10KB)
4. Falls back from Claude → GPT-4o on error
