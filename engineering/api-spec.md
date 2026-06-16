# API Specification — AI System Design Assistant

> Base URL: `https://api.sysdesign.ai/v1`
> All requests must include `Content-Type: application/json`.
> Authenticated endpoints require `Authorization: Bearer <jwt_token>`.

---

## Authentication

Auth is handled via Clerk. On successful sign-in, Clerk issues a short-lived JWT. Pass it as a Bearer token on all protected endpoints. Token lifetime: 15 minutes. Refresh via Clerk SDK — never manually.

| Header | Value |
|---|---|
| `Authorization` | `Bearer <clerk_jwt>` |
| `Content-Type` | `application/json` |

---

## Endpoints

---

### POST `/api/generate`
**Initiate a new generation session**
Auth: Optional (unauthenticated users get ephemeral sessions, 24hr TTL)

**Request Body**
```json
{
  "prompt": "string (required, 10–2000 chars)",
  "options": {
    "include_mobile": "boolean (default: false)",
    "scale": "startup | growth | enterprise (default: startup)",
    "depth": "mvp | full (default: full)",
    "sections": ["architecture", "flows", "stack", "prd", "trd"]
  }
}
```

**Response `202 Accepted`**
```json
{
  "session_id": "sess_abc123",
  "stream_url": "/api/generate/sess_abc123/stream",
  "estimated_seconds": 40,
  "status": "queued"
}
```

**Error Codes**
| Code | Reason |
|---|---|
| `400` | Prompt missing or under 10 characters |
| `422` | Invalid options value (e.g. unknown scale) |
| `429` | Rate limit exceeded (5/hr free, 60/hr pro) |

---

### GET `/api/generate/:session_id/stream`
**SSE stream — receive live stage events**
Auth: Optional (must match session ownership)
Protocol: `text/event-stream`

**Stream Event Shape**
Each event is a JSON object emitted as `data: {...}\n\n`

```json
{
  "stage": 1,
  "stage_name": "prompt_ingestion | classification | architecture | flows | stack | prd | trd",
  "status": "started | streaming | complete | error",
  "payload": {},
  "tokens_used": 312,
  "duration_ms": 2840
}
```

**Payload per stage**

| Stage | Payload content |
|---|---|
| 1 — Prompt Ingestion | `{ detected_features, detected_constraints, ambiguities }` |
| 2 — Classification | `{ product_type, scale, complexity_score, primary_personas }` |
| 3 — Architecture | `{ components[] }` — full component graph |
| 4 — Flows | `{ user_journey[], api_sequences[] }` |
| 5 — Stack | `{ layers[] }` — tech stack per layer |
| 6 — PRD | `{ problem_statement, features[], personas[], roadmap[] }` |
| 7 — TRD | `{ api_contracts[], db_schema[], security[], slos[] }` |

**Stream terminates with**
```json
{ "status": "done", "session_id": "sess_abc123", "total_tokens": 4821, "total_ms": 38200 }
```

**Error Codes**
| Code | Reason |
|---|---|
| `404` | Session not found |
| `410` | Session expired (ephemeral sessions after 24hr) |

---

### GET `/api/sessions/:session_id`
**Retrieve full completed session output**
Auth: Optional (public sessions) / Required (private)

**Response `200 OK`**
```json
{
  "session_id": "sess_abc123",
  "prompt": "Build me a food delivery app",
  "status": "complete | processing | failed",
  "created_at": "2024-01-15T10:30:00Z",
  "stages": {
    "1": { "payload": {}, "tokens_used": 210, "duration_ms": 1200 },
    "2": { "payload": {}, "tokens_used": 180, "duration_ms": 980 },
    "3": { "payload": {}, "tokens_used": 620, "duration_ms": 4100 },
    "4": { "payload": {}, "tokens_used": 540, "duration_ms": 3800 },
    "5": { "payload": {}, "tokens_used": 390, "duration_ms": 2600 },
    "6": { "payload": {}, "tokens_used": 880, "duration_ms": 6200 },
    "7": { "payload": {}, "tokens_used": 920, "duration_ms": 7400 }
  }
}
```

**Error Codes**
| Code | Reason |
|---|---|
| `404` | Session not found |
| `403` | Session is private and requester is not the owner |

---

### PUT `/api/sessions/:session_id/stage/:stage_number`
**Regenerate a single stage without re-running the full pipeline**
Auth: Required

`stage_number` must be `1` through `7`.

**Request Body**
```json
{
  "override_prompt": "string (optional — use to tweak input for this stage only)",
  "options": {}
}
```

**Response `202 Accepted`**
```json
{
  "session_id": "sess_abc123",
  "stage": 3,
  "stream_url": "/api/generate/sess_abc123/stream?stage=3",
  "status": "queued"
}
```

**Error Codes**
| Code | Reason |
|---|---|
| `400` | stage_number out of range |
| `404` | Session not found |
| `409` | Session is currently processing — cannot regenerate a stage |

---

### POST `/api/sessions/:session_id/chat`
**Ask a follow-up question in the context of a session**
Auth: Required
Protocol: `text/event-stream` (streams response tokens)

**Request Body**
```json
{
  "message": "string (required, max 1000 chars)",
  "focus_stage": 3
}
```

`focus_stage` is optional — if provided, the LLM focuses its answer on that stage's output.

**Stream Response**
Tokens streamed as plain `text/event-stream`. Final event:
```json
{ "status": "done", "tokens_used": 340 }
```

**Error Codes**
| Code | Reason |
|---|---|
| `400` | Message missing or exceeds 1000 chars |
| `404` | Session not found |
| `429` | Chat rate limit (20 messages/session free, unlimited pro) |

---

### POST `/api/sessions/:session_id/export`
**Generate and download the full design package**
Auth: Optional (for public sessions) / Required (for private)

**Request Body**
```json
{
  "format": "pdf | markdown | json | zip",
  "sections": ["architecture", "flows", "stack", "prd", "trd"]
}
```

`sections` is optional — omit to export all sections.

**Response `200 OK`**
```json
{
  "export_id": "exp_xyz789",
  "format": "pdf",
  "download_url": "https://r2.sysdesign.ai/exports/exp_xyz789.pdf?token=...",
  "expires_at": "2024-01-16T10:30:00Z",
  "size_bytes": 284200
}
```

Download URL is a pre-signed R2/S3 URL valid for 24 hours.

**Error Codes**
| Code | Reason |
|---|---|
| `400` | Invalid format or section name |
| `404` | Session not found or not yet complete |
| `503` | Export service temporarily unavailable |

---

## Rate Limits

| Plan | Generate | Chat | Export |
|---|---|---|---|
| Free (unauth) | 3/day | — | 3/day |
| Free (auth) | 5/hr | 20 msg/session | 5/day |
| Pro | 60/hr | Unlimited | Unlimited |

Rate limit headers returned on every response:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1705312200
```

---

## Common Error Envelope

All error responses follow this shape:
```json
{
  "error": {
    "code": "RATE_LIMITED | NOT_FOUND | UNAUTHORIZED | VALIDATION_ERROR | SERVER_ERROR",
    "message": "Human-readable description",
    "details": {}
  }
}
```
