# Environment Variables — AI System Design Assistant

> Single source of truth for all environment variables across all services.
> **Never commit actual values to git.** Use `.env.local` for local dev and the platform secret managers for staging/production.
> Secret managers: Infisical (preferred) or AWS Secrets Manager.

---

## Services Overview

| Service | Platform | Env file |
|---|---|---|
| Frontend | Vercel | Vercel dashboard → Environment Variables |
| Backend API | Railway | Railway → Variables tab |
| AI Worker | Railway (same service or separate) | Railway → Variables tab |
| Local dev | All | `.env.local` in project root (gitignored) |

---

## Frontend Variables (Vercel / Next.js)

> Prefix with `NEXT_PUBLIC_` only if the variable must be accessible in the browser. All others are server-only.

| Variable | Required | Example | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `https://api.sysdesign.ai/v1` | Backend API base URL. In local dev: `http://localhost:3001/v1` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | `pk_live_...` | Clerk publishable key — safe to expose to browser |
| `CLERK_SECRET_KEY` | Yes | `sk_live_...` | Clerk secret key — server-side only, never expose |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | `phc_...` | PostHog project API key for product analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | `https://app.posthog.com` | PostHog ingestion host |
| `NEXT_PUBLIC_APP_ENV` | Yes | `production` | `development`, `staging`, or `production` |

---

## Backend API Variables (Railway — Node.js / Fastify)

| Variable | Required | Example | Description |
|---|---|---|---|
| `PORT` | Yes | `3001` | Port the API server listens on. Railway sets this automatically. |
| `NODE_ENV` | Yes | `production` | `development` or `production` |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/db` | Supabase Postgres connection string with PgBouncer pooler URL |
| `DIRECT_URL` | Yes | `postgresql://user:pass@host:5432/db` | Direct (non-pooled) Postgres URL — used by Drizzle migrations only |
| `REDIS_URL` | Yes | `rediss://default:token@host:6379` | Upstash Redis URL for BullMQ queues and rate limiting |
| `CLERK_SECRET_KEY` | Yes | `sk_live_...` | Used to verify JWTs from the frontend |
| `CLERK_WEBHOOK_SECRET` | Yes | `whsec_...` | Svix webhook secret for Clerk user events (plan sync) |
| `ANTHROPIC_API_KEY` | Yes | `sk-ant-...` | Anthropic API key for Claude Sonnet — primary LLM |
| `OPENAI_API_KEY` | No | `sk-...` | OpenAI API key for GPT-4o fallback model |
| `R2_ACCOUNT_ID` | Yes | `abc123` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | Yes | `...` | R2 access key (S3-compatible) |
| `R2_SECRET_ACCESS_KEY` | Yes | `...` | R2 secret key |
| `R2_BUCKET_NAME` | Yes | `sysdesign-payloads` | R2 bucket name for stage payload storage |
| `R2_PUBLIC_URL` | Yes | `https://r2.sysdesign.ai` | Public base URL for R2 bucket (used in signed URLs) |
| `LANGFUSE_PUBLIC_KEY` | No | `pk-lf-...` | Langfuse public key for LLM tracing |
| `LANGFUSE_SECRET_KEY` | No | `sk-lf-...` | Langfuse secret key |
| `LANGFUSE_HOST` | No | `https://cloud.langfuse.com` | Langfuse host |
| `SENTRY_DSN` | No | `https://...@sentry.io/...` | Sentry DSN for error tracking |
| `CORS_ORIGIN` | Yes | `https://sysdesign.ai` | Allowed CORS origin. In dev: `http://localhost:3000` |
| `EXPORT_JOB_TIMEOUT_MS` | No | `30000` | Max ms for export job before timeout. Default: 30000 |
| `MAX_PROMPT_LENGTH` | No | `2000` | Max characters accepted in a prompt. Default: 2000 |

---

## AI Worker Variables (Railway)

If the AI pipeline runs as a separate worker process (recommended for production):

| Variable | Required | Example | Description |
|---|---|---|---|
| `REDIS_URL` | Yes | same as API | Shared Redis — worker pulls jobs from the same BullMQ queue |
| `DATABASE_URL` | Yes | same as API | Worker writes stage output URLs back to Postgres |
| `ANTHROPIC_API_KEY` | Yes | same as API | Worker makes all LLM calls |
| `OPENAI_API_KEY` | No | same as API | Fallback |
| `R2_ACCESS_KEY_ID` | Yes | same as API | Worker writes payloads to R2 |
| `R2_SECRET_ACCESS_KEY` | Yes | same as API | — |
| `R2_BUCKET_NAME` | Yes | same as API | — |
| `LANGFUSE_PUBLIC_KEY` | No | same as API | Worker traces LLM calls to Langfuse |
| `LANGFUSE_SECRET_KEY` | No | same as API | — |
| `WORKER_CONCURRENCY` | No | `5` | Number of jobs the worker processes in parallel. Default: 5 |

---

## Local Development Setup

1. Copy the example file:
```bash
cp .env.example .env.local
```

2. Fill in all `Required: Yes` variables. For local dev, use:
   - A Supabase local instance or a personal Supabase project
   - Upstash Redis free tier
   - Anthropic API key from console.anthropic.com
   - Clerk development keys (separate from prod keys)

3. `.env.local` is gitignored — confirm with:
```bash
git check-ignore -v .env.local
```

---

## `.env.example` Template

```bash
# ── Frontend ──────────────────────────────────────────────
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/v1
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_APP_ENV=development

# ── Backend API ───────────────────────────────────────────
PORT=3001
NODE_ENV=development
DATABASE_URL=
DIRECT_URL=
REDIS_URL=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=sysdesign-payloads-dev
R2_PUBLIC_URL=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
SENTRY_DSN=
CORS_ORIGIN=http://localhost:3000

# ── Worker ────────────────────────────────────────────────
WORKER_CONCURRENCY=2
```

---

## Rotation Policy

| Variable | Rotation frequency | Owner |
|---|---|---|
| `ANTHROPIC_API_KEY` | Every 90 days | Backend Lead |
| `OPENAI_API_KEY` | Every 90 days | Backend Lead |
| `CLERK_SECRET_KEY` | Every 180 days | DevOps |
| `R2_ACCESS_KEY_ID / SECRET` | Every 90 days | DevOps |
| `DATABASE_URL` | On team member offboarding | DevOps |
| `REDIS_URL` | On team member offboarding | DevOps |
