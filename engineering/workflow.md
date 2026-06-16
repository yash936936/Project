# Workflow — AI System Design Assistant

## Overview

Seven distinct stages take a single user prompt all the way to a fully exportable system design package. Each stage feeds structured output into the next.

---

## Stage 1 — Prompt Ingestion

User describes their website or product in natural language — as simple as "build me an e-commerce site" or as detailed as a feature list. The agent accepts unstructured input and asks clarifying questions if scope is ambiguous.

**Tags:** Natural language · Intent extraction · Domain classification

---

## Stage 2 — System Classification & Scoping

The LLM classifies the product type (SaaS, marketplace, CMS, fintech, social, etc.), infers expected scale (startup / growth / enterprise), identifies primary user personas, and determines key system constraints like real-time, file handling, or payment flows.

**Tags:** Product type tagging · Scale inference · Constraint detection

---

## Stage 3 — Architecture Generation

A structured JSON representation of the system is produced — services, databases, queues, CDNs, third-party integrations. This JSON is then rendered into an interactive architecture diagram using a diagramming engine (Mermaid or D3-based).

**Tags:** JSON schema · Component graph · Interactive diagram

---

## Stage 4 — Flow Diagram Generation

Three types of flows are generated in parallel:

- **User journey flows** — screens and decisions
- **Data flow diagrams** — how data moves between components
- **API sequence diagrams** — request/response lifecycles for key operations like auth, checkout, and search

**Tags:** User journey · Data flow · API sequences

---

## Stage 5 — Tech Stack Recommendation

Based on the classified product type and constraints, the agent recommends a layered tech stack — frontend, backend, database, infra, DevOps, and third-party services. Each recommendation includes a rationale and trade-off comparison against alternatives.

**Tags:** Layer-by-layer stack · Rationale · Alternatives

---

## Stage 6 — PRD Generation

A full Product Requirements Document is synthesised — problem statement, user personas, prioritised feature list (MoSCoW), user stories with acceptance criteria, success metrics, and a phased delivery roadmap.

**Tags:** Problem statement · User stories · MoSCoW prioritisation

---

## Stage 7 — TRD Generation & Export

A Technical Requirements Document covers API contracts, database schema, security model, scalability strategy, and deployment topology. All outputs — diagrams + PRD + TRD — are bundled for export as PDF, Markdown, or pushed to Notion/Confluence.

**Tags:** API contracts · DB schema · Export (PDF / MD)

---

## Key Design Decisions

| Decision | Description |
|---|---|
| **Streaming output** | Each stage streams results progressively so users see value within seconds, not after a 30s wait. |
| **Iterative refinement** | Users can edit the prompt or click any component in the diagram to regenerate just that section. |
| **Context chaining** | All 7 stages share a single context object, so PRD and TRD stay consistent with the architecture. |
| **Bundled export** | One-click export packs diagrams, PRD, TRD, and stack doc into a shareable ZIP or Notion page. |
