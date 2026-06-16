# App Flow — AI System Design Assistant

## Overview

Eight screens form the end-to-end user experience. Each screen represents a distinct step in the journey from initial prompt to exported design package.

---

## Screen 1 — Landing Page
**Hero + prompt examples**

- Headline + sub-headline positioning the product as "describe it, design it"
- Large prompt input field as the primary CTA (no sign-up wall for first generation)
- 3–4 example prompt chips: "SaaS analytics dashboard", "Food delivery marketplace", "Fintech wallet app"
- Social proof row (logos of generated diagrams, not testimonials)
- Sign-in option to save history — deferred, not blocking

---

## Screen 2 — Prompt Input & Configuration
**Input + optional config**

- Expandable textarea for detailed prompt entry with character guidance
- Optional toggles: "Include mobile app", "Enterprise scale", "Add real-time features"
- Optional depth selectors: Startup MVP / Growth stage / Enterprise — changes diagram complexity
- Output preferences: which sections to generate (all or selective)
- "Generate" CTA — triggers the 7-stage pipeline

---

## Screen 3 — Generation Progress Screen
**Animated step tracker**

- 7-step progress bar, each step showing status (pending / in-progress / done)
- Streaming preview: architecture JSON appears live in a side panel as it's generated
- Estimated time remaining per step (typically 3–8 sec each)
- Cancel option — stops generation and discards partial output
- Background continues even if user navigates away; notification on completion

---

## Screen 4 — Architecture Diagram Canvas
**Primary output screen**

- Full-canvas interactive architecture diagram — pan, zoom, click nodes
- Clicking a node (e.g. "Auth Service") shows a detail drawer: responsibilities, API contracts, scaling notes
- Zoom levels: overview / service-level / component-level
- Toggle layers: show/hide databases, queues, CDN, monitoring, third-party services
- Inline edit: right-click any node to rename, remove, or ask AI to add a new service
- Minimap navigator in bottom-right corner

---

## Screen 5 — Flow Diagrams Panel
**3 flow types as subtabs**

- Sub-tabs: User Journey / Data Flow / API Sequence
- **User Journey:** screen-by-screen flowchart with decision diamonds
- **Data Flow:** shows how data enters, transforms, and persists across components
- **API Sequence:** UML-style sequence diagrams for key API calls (auth, create order, etc.)
- All flows linked to the main architecture — clicking a service highlights it on the canvas

---

## Screen 6 — Tech Stack Recommendation
**Layered stack card view**

- Layer cards: Frontend / Backend / Database / Infra / Auth / Monitoring / DevOps
- Each card shows primary recommendation + 1–2 alternatives with a "why" rationale
- Trade-off matrix: cost, complexity, scalability, team familiarity sliders
- AI chat inline: "Why not use GraphQL here?" → agent responds in context
- One-click swap: change a tech choice and watch how it affects other layers

---

## Screen 7 — PRD & TRD Document View
**Structured document reader**

- Sidebar TOC for navigation within the doc
- Inline editing — click any section to edit or ask AI to rewrite
- **PRD sections:** Overview, Personas, Features, User Stories, Metrics, Roadmap
- **TRD sections:** Architecture Decisions, API Contracts, DB Schema, Security, SLAs
- Comment mode: leave inline notes to share with team

---

## Screen 8 — Export & Share
**Multi-format output**

- Export individual sections or full bundle
- Formats: PDF (styled), Markdown, JSON (diagram schema), PNG/SVG (diagrams)
- Integrations: push to Notion page, Confluence, GitHub repo, Linear project
- Shareable read-only link with optional password protection
- Version history: each regeneration creates a snapshot the user can diff
