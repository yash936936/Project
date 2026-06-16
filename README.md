# AI System Design Assistant — Project Docs

This folder contains all planning and design documentation for the AI System Design Assistant project. Every file here was derived from the master blueprint (`sysdesign_ai_blueprint.html`).

---

## Folder Structure

```
docs/
├── README.md                          ← You are here (index + guide)
│
├── design/
│   └── sysdesign_ai_blueprint.html    ← Master visual blueprint (source of truth)
│
├── product/
│   ├── prd.md                         ← Product Requirements Document
│   └── appflow.md                     ← Screen-by-screen app flow (8 screens)
│
├── engineering/
│   ├── trd.md                         ← Technical Requirements Document
│   └── workflow.md                    ← 7-stage AI pipeline workflow
│
└── decisions/
    └── adr/                           ← Architecture Decision Records (add as needed)
        └── .gitkeep
```

---

## Document Summary

| File | Purpose | Audience |
|---|---|---|
| `sysdesign_ai_blueprint.html` | Visual master blueprint — single source of truth | All |
| `prd.md` | Problem, personas, features (MoSCoW), metrics, roadmap | PM, Stakeholders |
| `appflow.md` | 8-screen UX flow with component detail per screen | Designer, Frontend Dev |
| `trd.md` | Architecture layers, API contracts, DB schema, security, SLOs | Backend Dev, DevOps |
| `workflow.md` | 7-stage AI pipeline — how prompt becomes output | AI Engineer, Full Stack |

---

## Suggested Files to Add

The following are **not yet created** but are strongly recommended before development starts:

### `product/`
- **`roadmap.md`** — Expand the Phase 1–4 plan from the PRD into a proper sprint-level breakdown with owners and dates.
- **`user-stories.md`** — Extract the full user story backlog (from PRD personas) into individual ticket-ready stories with acceptance criteria.

### `engineering/`
- **`api-spec.md`** — Full OpenAPI-style documentation for each of the 6 API endpoints defined in the TRD (request bodies, response schemas, error codes).
- **`db-schema.md`** — Expanded schema file with column types, indexes, constraints, and migration notes for all 5 tables.
- **`env-vars.md`** — Catalogue every environment variable the system needs (API keys, DB URLs, Redis URL, feature flags) with description and which service owns it.
- **`prompt-library.md`** — Version-controlled prompts for all 7 pipeline stages. Essential for the LLM layer since prompts are the core logic.

### `decisions/adr/`
- **`001-llm-provider.md`** — Why Claude Sonnet as primary + GPT-4o fallback.
- **`002-streaming-sse.md`** — Why SSE over WebSockets for stage streaming.
- **`003-storage-r2.md`** — Why Cloudflare R2 over S3 for diagram/doc payloads.

---

## How to Use This Folder

1. **Start with `prd.md`** to understand what is being built and why.
2. **Read `appflow.md`** to understand the user journey before touching any UI code.
3. **Read `workflow.md`** to understand the AI pipeline before writing any backend logic.
4. **Use `trd.md`** as the reference for every implementation decision — API design, DB schema, security, and infra.
5. **Keep `sysdesign_ai_blueprint.html` as the visual anchor** — open it in a browser when onboarding new team members.
