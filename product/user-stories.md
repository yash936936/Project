# User Stories — AI System Design Assistant

> Format: `As a [persona], I want [action], so that [outcome].`
> Personas: **PM** (Product Manager) · **DE** (Developer/Founder) · **SA** (Solutions Architect) · **ST** (Student/Learner)
> Status: `backlog | in-progress | done`

---

## Epic 1 — Prompt Input & Generation

### US-001 · Natural Language Input
**As a** DE, **I want** to describe my product in plain English without filling in a form, **so that** I can get a system design without needing to know the right terminology upfront.

**Priority:** Must
**Acceptance Criteria:**
- [ ] Textarea accepts freeform text between 10 and 2000 characters
- [ ] Submit button is disabled if input is under 10 characters
- [ ] Submission triggers the 7-stage pipeline and redirects to the progress screen
- [ ] No sign-up is required to submit a first generation

---

### US-002 · Generation Options
**As a** SA, **I want** to configure the scale and depth of the output before generating, **so that** the architecture matches the client's actual context (startup vs enterprise).

**Priority:** Must
**Acceptance Criteria:**
- [ ] User can select scale: Startup / Growth / Enterprise before generating
- [ ] User can toggle "Include mobile app" on or off
- [ ] User can select MVP or Full depth
- [ ] Selected options are reflected in the generated architecture complexity

---

### US-003 · Progress Visibility
**As a** PM, **I want** to see which of the 7 stages is currently running and how long it's taking, **so that** I know the tool is working and can estimate when it'll be done.

**Priority:** Must
**Acceptance Criteria:**
- [ ] Progress screen shows all 7 stages with status: pending / in-progress / complete / error
- [ ] Each stage shows elapsed time while in-progress
- [ ] First stage begins streaming within 3 seconds of submission
- [ ] If a stage errors, the error is shown inline and remaining stages are skipped
- [ ] User can cancel generation from this screen

---

### US-004 · Prompt Example Chips
**As a** ST, **I want** to see example prompts I can click to pre-fill the input, **so that** I can get started without knowing what to type.

**Priority:** Should
**Acceptance Criteria:**
- [ ] Landing page shows at least 3 example prompt chips
- [ ] Clicking a chip pre-fills the textarea with that prompt
- [ ] Chips cover at least 3 different product types (e.g. SaaS, marketplace, fintech)

---

## Epic 2 — Architecture Diagram

### US-005 · Interactive Architecture Canvas
**As a** DE, **I want** to see my system architecture as an interactive diagram I can pan and zoom, **so that** I can explore the full architecture without it being too small to read.

**Priority:** Must
**Acceptance Criteria:**
- [ ] Diagram renders all components from Stage 3 as named nodes
- [ ] Connections between components are shown as labelled edges
- [ ] User can pan by dragging and zoom with scroll wheel or pinch
- [ ] A minimap is shown in the bottom-right corner for navigation
- [ ] Diagram renders within 2 seconds of Stage 3 completing

---

### US-006 · Component Detail Drawer
**As a** SA, **I want** to click on any component in the diagram to see its responsibilities and API contracts, **so that** I can quickly explain individual services to a client.

**Priority:** Should
**Acceptance Criteria:**
- [ ] Clicking a node opens a side drawer without leaving the canvas
- [ ] Drawer shows: component name, type, responsibilities (list), connections (list)
- [ ] Drawer can be closed without losing zoom/pan position
- [ ] Clicking a connected component in the drawer navigates to that node on the canvas

---

### US-007 · Layer Visibility Toggles
**As a** DE, **I want** to show or hide infrastructure layers (databases, queues, CDN, monitoring), **so that** I can simplify the diagram when presenting to non-technical stakeholders.

**Priority:** Should
**Acceptance Criteria:**
- [ ] Toggle buttons for: Databases / Queues / CDN / Monitoring / Third-party
- [ ] Toggling a layer hides those node types and their edges from the canvas
- [ ] Toggling does not change the underlying data — re-toggling restores the nodes
- [ ] Toggle state persists within the session

---

### US-008 · Inline Node Editing
**As a** SA, **I want** to right-click any node to rename it, remove it, or ask AI to add a related service, **so that** I can tailor the architecture to a specific client without regenerating everything.

**Priority:** Should
**Acceptance Criteria:**
- [ ] Right-click on a node opens a context menu: Rename / Remove / Add related service
- [ ] Rename updates the node label immediately (optimistic UI)
- [ ] Remove deletes the node and its edges from the canvas
- [ ] "Add related service" sends a single-stage regeneration request and adds the new node
- [ ] Changes are saved to the session

---

## Epic 3 — Flow Diagrams

### US-009 · User Journey Flow
**As a** PM, **I want** to see a screen-by-screen user journey flow for each persona, **so that** I can validate that the product covers the full user experience before writing specs.

**Priority:** Must
**Acceptance Criteria:**
- [ ] User journey flow renders for each persona from Stage 2 (max 3)
- [ ] Flow shows screen nodes, decision diamonds, and action nodes
- [ ] Each decision node has exactly 2 outgoing paths labelled (e.g. Yes / No)
- [ ] All paths eventually reach an "End" node

---

### US-010 · API Sequence Diagrams
**As a** DE, **I want** to see UML-style sequence diagrams for the 3 most critical API flows, **so that** I understand the request/response lifecycle before writing any code.

**Priority:** Should
**Acceptance Criteria:**
- [ ] At least 3 sequence diagrams are generated (e.g. auth, core CRUD, key transaction)
- [ ] Participants in the diagram use the actual component names from Stage 3
- [ ] Each step is labelled with the operation and method (e.g. POST /api/sessions)
- [ ] Async steps are visually distinct from synchronous request/response

---

## Epic 4 — Tech Stack

### US-011 · Layer-by-Layer Stack Cards
**As a** DE, **I want** to see the recommended tech stack broken out by layer with a rationale for each choice, **so that** I can make an informed decision rather than just copying the output blindly.

**Priority:** Must
**Acceptance Criteria:**
- [ ] Stack is presented as one card per layer: Frontend / Backend / DB / Cache / Auth / Monitoring / DevOps
- [ ] Each card shows: primary recommendation, 1–2 alternatives, rationale sentence, trade-off sentence
- [ ] Rationale references the product type or a specific constraint from Stage 2

---

### US-012 · One-Click Tech Swap
**As a** SA, **I want** to swap a recommended technology for an alternative and see how it affects the rest of the stack, **so that** I can customise the recommendation for a client who already uses specific tools.

**Priority:** Could
**Acceptance Criteria:**
- [ ] Each layer card shows alternative options as clickable chips
- [ ] Clicking an alternative makes it the selected primary for that layer
- [ ] Any layers that have a dependency on the changed layer are highlighted
- [ ] A "Reset to recommended" button restores the original AI recommendation

---

## Epic 5 — PRD & TRD Documents

### US-013 · Structured PRD View
**As a** PM, **I want** to read the generated PRD in a clean structured document view with a table of contents, **so that** I can navigate to specific sections quickly and share it with stakeholders.

**Priority:** Must
**Acceptance Criteria:**
- [ ] PRD renders with sections: Problem Statement / Personas / Features / User Stories / Metrics / Roadmap
- [ ] A sidebar TOC is shown on desktop (>768px) for one-click section navigation
- [ ] Each feature shows its MoSCoW priority tag
- [ ] User stories include acceptance criteria displayed as a checklist

---

### US-014 · Inline Document Editing
**As a** SA, **I want** to click on any section of the PRD or TRD and edit it or ask AI to rewrite it, **so that** I can customise the output for a specific client without copy-pasting into another tool.

**Priority:** Should
**Acceptance Criteria:**
- [ ] Clicking any paragraph enters inline edit mode
- [ ] An "Ask AI to rewrite this" button opens a mini prompt bar for that section
- [ ] Edits are saved to the session automatically after 2 seconds of inactivity (autosave)
- [ ] An "Undo" action restores the previous version of an edited section

---

## Epic 6 — Export & Share

### US-015 · Full Bundle Export
**As a** PM, **I want** to export the complete design package (diagrams + PRD + TRD) as a single PDF or ZIP, **so that** I can share it with engineers and executives who don't have access to this tool.

**Priority:** Must
**Acceptance Criteria:**
- [ ] Export button is available from any screen once generation is complete
- [ ] User can choose format: PDF / Markdown / JSON / ZIP
- [ ] User can select which sections to include before exporting
- [ ] Download starts within 10 seconds of clicking Export
- [ ] PDF includes rendered diagram images, not just component lists

---

### US-016 · Shareable Read-Only Link
**As a** SA, **I want** to generate a shareable read-only link to my generated design, **so that** I can send it to a client for review without them needing an account.

**Priority:** Could
**Acceptance Criteria:**
- [ ] "Share" button generates a unique URL for the session
- [ ] Recipients can view all diagrams and documents without signing in
- [ ] Owner can revoke the link from the session settings
- [ ] Optional: password protection for the shared link

---

## Story Map Summary

| Epic | US IDs | Priority range |
|---|---|---|
| Prompt & Generation | US-001 to US-004 | Must → Should |
| Architecture Diagram | US-005 to US-008 | Must → Should |
| Flow Diagrams | US-009 to US-010 | Must → Should |
| Tech Stack | US-011 to US-012 | Must → Could |
| PRD & TRD | US-013 to US-014 | Must → Should |
| Export & Share | US-015 to US-016 | Must → Could |
