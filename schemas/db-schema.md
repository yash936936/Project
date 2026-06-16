# Database Schema — AI System Design Assistant

> Engine: PostgreSQL 15 via Supabase
> Connection pooling: PgBouncer (transaction mode, max 20 connections per pod)
> All timestamps are `TIMESTAMPTZ` stored in UTC.
> All primary keys are UUIDs generated server-side (`gen_random_uuid()`).

---

## Table: `users`

Minimal local record — Clerk is the auth source of truth. Created on first sign-in.

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | No | Internal PK |
| `clerk_id` | TEXT | No | Clerk user ID — used for auth lookups |
| `email` | TEXT | No | Synced from Clerk on first sign-in |
| `plan` | TEXT | No | Default `free`; upgraded via billing webhook |
| `created_at` | TIMESTAMPTZ | No | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | No | Updated via trigger on any row change |

**Indexes**
```sql
CREATE UNIQUE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

---

## Table: `sessions`

One row per generation attempt. Owns all stage outputs via `session_id` FK.

```sql
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  prompt          TEXT NOT NULL,
  product_type    TEXT,
  scale           TEXT CHECK (scale IN ('startup', 'growth', 'enterprise')),
  complexity      SMALLINT CHECK (complexity BETWEEN 1 AND 3),
  status          TEXT NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued', 'processing', 'complete', 'failed')),
  options         JSONB NOT NULL DEFAULT '{}',
  total_tokens    INTEGER DEFAULT 0,
  total_ms        INTEGER DEFAULT 0,
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);
```

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | No | Session PK — also the `session_id` in API responses |
| `user_id` | UUID | Yes | Null for unauthenticated (ephemeral) sessions |
| `prompt` | TEXT | No | Raw user prompt — max 2000 chars enforced at API layer |
| `product_type` | TEXT | Yes | Set after Stage 2 completes |
| `scale` | TEXT | Yes | Set after Stage 2 completes |
| `complexity` | SMALLINT | Yes | 1–3, set after Stage 2 |
| `status` | TEXT | No | Pipeline status |
| `options` | JSONB | No | Generation options from request body |
| `total_tokens` | INTEGER | Yes | Cumulative tokens across all 7 stages |
| `total_ms` | INTEGER | Yes | Cumulative wall-clock time |
| `is_public` | BOOLEAN | No | Public sessions shareable via read-only link |
| `completed_at` | TIMESTAMPTZ | Yes | Set when status transitions to `complete` or `failed` |

**Indexes**
```sql
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
```

**Relationships**
- `user_id → users.id` (nullable FK — ephemeral sessions have no user)

---

## Table: `stage_outputs`

One row per stage per session. Payload JSON stored in R2 — only the URL is stored here.

```sql
CREATE TABLE stage_outputs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  stage           SMALLINT NOT NULL CHECK (stage BETWEEN 1 AND 7),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'complete', 'error')),
  payload_url     TEXT,
  payload_size    INTEGER,
  tokens_used     INTEGER DEFAULT 0,
  duration_ms     INTEGER DEFAULT 0,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  UNIQUE (session_id, stage)
);
```

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | No | PK |
| `session_id` | UUID | No | FK → sessions |
| `stage` | SMALLINT | No | 1–7, unique per session |
| `status` | TEXT | No | Stage-level pipeline status |
| `payload_url` | TEXT | Yes | Pre-signed R2 URL to the stage JSON payload |
| `payload_size` | INTEGER | Yes | Bytes of the JSON payload in R2 |
| `tokens_used` | INTEGER | Yes | LLM tokens consumed for this stage |
| `duration_ms` | INTEGER | Yes | Wall-clock time for this stage |
| `error_message` | TEXT | Yes | Set if status = `error` |

**Indexes**
```sql
CREATE INDEX idx_stage_outputs_session_id ON stage_outputs(session_id);
CREATE UNIQUE INDEX idx_stage_outputs_session_stage ON stage_outputs(session_id, stage);
```

---

## Table: `exports`

One row per export request. Download URLs are signed and expire after 24 hours.

```sql
CREATE TABLE exports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  format          TEXT NOT NULL CHECK (format IN ('pdf', 'markdown', 'json', 'zip')),
  sections        TEXT[] NOT NULL DEFAULT ARRAY['architecture','flows','stack','prd','trd'],
  download_url    TEXT NOT NULL,
  storage_key     TEXT NOT NULL,
  size_bytes      INTEGER,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | No | Export PK |
| `session_id` | UUID | No | FK → sessions |
| `user_id` | UUID | Yes | Null for unauthenticated exports |
| `format` | TEXT | No | Output format |
| `sections` | TEXT[] | No | Which sections were included |
| `download_url` | TEXT | No | Pre-signed R2 URL |
| `storage_key` | TEXT | No | R2 object key (used to regenerate signed URL if needed) |
| `expires_at` | TIMESTAMPTZ | No | 24hr from created_at |

**Indexes**
```sql
CREATE INDEX idx_exports_session_id ON exports(session_id);
CREATE INDEX idx_exports_expires_at ON exports(expires_at);
```

**Cleanup job:** A nightly cron deletes rows where `expires_at < NOW()` and removes the R2 object via storage key.

---

## Table: `usage_events`

Append-only billing ledger and rate-limiting source. Never updated, only inserted.

```sql
CREATE TABLE usage_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL CHECK (event_type IN ('generate', 'regenerate', 'chat', 'export')),
  tokens_used     INTEGER NOT NULL DEFAULT 0,
  cost_usd        NUMERIC(10, 6) NOT NULL DEFAULT 0,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | No | PK |
| `user_id` | UUID | Yes | Null for unauthenticated events |
| `session_id` | UUID | Yes | Associated session if applicable |
| `event_type` | TEXT | No | Type of billable event |
| `tokens_used` | INTEGER | No | Tokens consumed in this event |
| `cost_usd` | NUMERIC | No | Computed cost at time of event |
| `metadata` | JSONB | Yes | Extra context (model used, stage, etc.) |

**Indexes**
```sql
CREATE INDEX idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX idx_usage_events_created_at ON usage_events(created_at DESC);
CREATE INDEX idx_usage_events_user_created ON usage_events(user_id, created_at DESC);
```

The last index supports the rate-limiting query: count events for a user in the last 1 hour.

---

## Migrations Strategy

- Migrations managed with **Drizzle ORM** (`drizzle-kit`)
- Migration files live in `src/db/migrations/`
- Never edit a migration file after it has been applied to production
- All schema changes go through a new migration file
- Run `drizzle-kit push` in development, `drizzle-kit migrate` in CI before deploy

```bash
# Generate a new migration after schema change
npx drizzle-kit generate:pg --schema=src/db/schema.ts

# Apply migrations (CI/CD)
npx drizzle-kit migrate:pg
```

---

## Entity Relationship Summary

```
users
  └── sessions (user_id → users.id, nullable)
        ├── stage_outputs (session_id → sessions.id, cascade delete)
        └── exports (session_id → sessions.id, cascade delete)

usage_events → users (nullable)
usage_events → sessions (nullable)
```
