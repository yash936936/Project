# ADR-002 — Streaming Protocol: SSE over WebSockets

**Status:** Accepted
**Date:** 2024-01
**Deciders:** Engineering Lead, Backend Engineer

---

## Context

The 7-stage generation pipeline takes 30–45 seconds end-to-end. Users must see progressive output rather than a blank screen followed by a full result. We need a real-time streaming protocol between the backend API and the frontend.

Options evaluated: Server-Sent Events (SSE), WebSockets, HTTP long-polling, HTTP/2 push.

---

## Decision

Use **Server-Sent Events (SSE)** via the `GET /api/generate/:id/stream` endpoint.

---

## Rationale

**Why SSE:**
- Generation is inherently **unidirectional** — the server pushes stage results, the client only reads. SSE is purpose-built for this pattern; WebSockets add bidirectional overhead we don't need.
- SSE works natively over HTTP/1.1 and HTTP/2 — no protocol upgrade handshake. This makes it compatible with Vercel Edge Functions and Cloudflare Workers without extra configuration.
- Built-in **automatic reconnection** in the browser `EventSource` API — if the connection drops mid-generation, the browser reconnects using `Last-Event-ID` and the server can resume from the last completed stage.
- SSE is stateless on the server side — each reconnect is a new HTTP request, which fits our stateless API design on Railway/Fly.io.
- Simpler to implement, test, and debug than WebSockets. `curl` can consume the stream directly for local testing.

**Why not WebSockets:**
- Bidirectional capability is unnecessary for stage streaming — overkill.
- WebSocket connections require sticky sessions or a shared pub/sub layer (e.g. Redis Pub/Sub) when running multiple API pods. SSE avoids this because the stream URL hits the pod holding the BullMQ job result.
- WebSocket support on some edge runtimes (Vercel Edge) is limited or experimental.

**Why not long-polling:**
- Introduces artificial latency (poll interval) — first streamed token would be delayed by up to the poll interval even if it's ready.
- Higher request overhead at scale — each poll is a full HTTP round-trip.

---

## Consequences

- Frontend must use the native `EventSource` API (or a thin wrapper) — not `fetch` with a streaming body. `EventSource` does not support custom headers, so the session auth token is passed as a query parameter on the stream URL: `?token=<jwt>` (validated server-side, short-lived).
- The backend must set `Content-Type: text/event-stream`, `Cache-Control: no-cache`, and `Connection: keep-alive` headers on the stream endpoint.
- Each SSE event must include an `id` field matching the stage number so the browser can send `Last-Event-ID` on reconnect and the server can resume from the correct stage.
- API gateway / load balancer must not buffer SSE responses — confirm `proxy_buffering off` (nginx) or equivalent is set on Railway's proxy layer.
- Chat responses (`POST /api/sessions/:id/chat`) use the same SSE pattern for token streaming.

---

## Review Trigger

Revisit if: we add collaborative real-time editing (multiple users on one session simultaneously), which would require true bidirectional messaging and push WebSockets back into scope.
