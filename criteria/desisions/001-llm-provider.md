# ADR-001 — LLM Provider: Claude Sonnet (Primary) + GPT-4o (Fallback)

**Status:** Accepted
**Date:** 2024-01
**Deciders:** Engineering Lead, AI Engineer

---

## Context

The 7-stage pipeline requires an LLM that can reliably produce **structured JSON output** for every stage. The model must handle:
- Long context (passing all prior stage outputs as context for later stages)
- Strict schema adherence (component graphs, API contracts, DB schemas)
- Low latency for streaming (first token must arrive within 3 seconds)
- Cost efficiency at scale (potentially thousands of generations per day)

We evaluated: Claude Sonnet (Anthropic), GPT-4o (OpenAI), Gemini 1.5 Pro (Google), Mistral Large.

---

## Decision

**Primary:** Claude Sonnet via Anthropic API
**Fallback:** GPT-4o via OpenAI API

---

## Rationale

**Why Claude Sonnet as primary:**
- Consistently outperformed alternatives on structured JSON output fidelity in internal evals — fewer schema violations, fewer hallucinated field names
- `tool_use` / function calling mode produces cleaner typed output than prompt-based JSON instruction with GPT-4o
- 200k token context window handles the full context chain (all 7 prior stage outputs) without truncation risk for complex prompts
- Streaming latency (time to first token) was ~300ms faster than GPT-4o in our test environment
- Anthropic's prompt caching can reduce cost on repeated system prompt content (relevant since system prompts are identical across users)

**Why GPT-4o as fallback:**
- Industry-standard reliability SLA — good fallback when Anthropic API has incidents
- Existing OpenAI SDK integration is low-effort to add
- Function calling mode is mature and well-documented
- Avoids single-vendor dependency for a production-critical path

**Why not Gemini 1.5 Pro:**
- JSON output mode was less consistent in evals — higher rate of schema field omissions
- Google Cloud latency from our Railway deployment region was higher

**Why not Mistral Large:**
- Structured output reliability did not meet the bar needed for stage 7 (TRD — most complex schema)

---

## Consequences

- Both `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` must be present in all environments (see `env-vars.md`)
- Fallback logic in the LLM orchestration layer must be implemented: retry Claude twice on failure, then switch to GPT-4o
- Prompt templates (see `prompt-library.md`) must be compatible with both models' tool_use / function calling formats — maintain two prompt variants if needed
- Cost tracking in `usage_events` table must log which model was used per stage (stored in `metadata` JSONB column)
- Model names must be configurable via env var (`LLM_PRIMARY_MODEL`, `LLM_FALLBACK_MODEL`) so we can switch models without a code deploy

---

## Review Trigger

Revisit this decision if: Anthropic API P99 uptime falls below 99%, a significantly cheaper model matches quality in evals, or context window requirements exceed 200k tokens.
