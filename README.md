# AI System Design Assistant — Project Docs

This folder contains all planning and design documentation for the AI System Design Assistant project. Every file here was derived from the master blueprint (`sysdesign_ai_blueprint.html`).

---

## Folder Structure

```
docs/
├── README.md                              ← You are here (index + guide)
│
├── design/
│   └── sysdesign_ai_blueprint.html        ← Master visual blueprint (source of truth)
│
├── product/
│   ├── prd.md                             ← Product Requirements Document
│   ├── appflow.md                         ← Screen-by-screen app flow (8 screens)
│   └── user-stories.md                    ← Full user story backlog (16 stories, 6 epics)
│
├── engineering/
│   ├── trd.md                             ← Technical Requirements Document
│   ├── workflow.md                        ← 7-stage AI pipeline workflow
│   ├── api-spec.md                        ← Full API specification (6 endpoints)
│   ├── db-schema.md                       ← Full DB schema (5 tables, indexes, migrations)
│   ├── env-vars.md                        ← All environment variables across all services
│   └── prompt-library.md                  ← Versioned LLM prompts for all 7 pipeline stages
│
└── decisions/
    └── adr/
        ├── 001-llm-provider.md            ← Claude Sonnet (primary) + GPT-4o (fallback)
        ├── 002-streaming-sse.md           ← SSE over WebSockets for stage streaming
        └── 003-storage-r2.md             ← Cloudflare R2 over AWS S3
```

---

## Document Summary

| File | Purpose | Audience |
|---|---|---|
| `sysdesign_ai_blueprint.html` | Visual master blueprint — single source of truth | All |
| `prd.md` | Problem, personas, features (MoSCoW), metrics, roadmap | PM, Stakeholders |
| `appflow.md` | 8-screen UX flow with component detail per screen | Designer, Frontend Dev |
| `user-stories.md` | 16 ticket-ready stories across 6 epics with acceptance criteria | PM, Dev Team |
| `trd.md` | Architecture layers, API contracts, DB schema, security, SLOs | Backend Dev, DevOps |
| `workflow.md` | 7-stage AI pipeline — how prompt becomes output | AI Engineer, Full Stack |
| `api-spec.md` | Request/response schemas, error codes for all 6 endpoints | Frontend Dev, Backend Dev |
| `db-schema.md` | Full SQL schema, column types, indexes, FK relationships, migrations | Backend Dev, DevOps |
| `env-vars.md` | All env vars per service with rotation policy and `.env.example` | DevOps, All Devs |
| `prompt-library.md` | Versioned prompts for all 7 stages with eval criteria | AI Engineer |
| `001-llm-provider.md` | ADR: why Claude Sonnet + GPT-4o fallback | Engineering Lead |
| `002-streaming-sse.md` | ADR: why SSE over WebSockets | Engineering Lead |
| `003-storage-r2.md` | ADR: why Cloudflare R2 over S3 | Engineering Lead, DevOps |

---

## How to Use This Folder

1. **Start with `prd.md`** to understand what is being built and why.
2. **Read `appflow.md`** to understand the user journey before touching any UI code.
3. **Read `workflow.md`** to understand the AI pipeline before writing any backend logic.
4. **Use `trd.md`** as the reference for every implementation decision — API design, DB schema, security, and infra.
5. **Use `api-spec.md`** when building any frontend↔backend integration — it has the full request/response contracts.
6. **Use `db-schema.md`** before writing any migration — it has column types, indexes, and FK relationships.
7. **Copy `.env.example` from `env-vars.md`** as your starting point for local dev setup.
8. **Read ADRs before changing a major architectural choice** — they explain why decisions were made and what the review triggers are.
9. **Keep `sysdesign_ai_blueprint.html` as the visual anchor** — open it in a browser when onboarding new team members.
