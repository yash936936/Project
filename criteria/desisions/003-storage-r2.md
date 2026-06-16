# ADR-003 — Object Storage: Cloudflare R2 over AWS S3

**Status:** Accepted
**Date:** 2024-01
**Deciders:** Engineering Lead, DevOps

---

## Context

Stage outputs (JSON payloads from all 7 pipeline stages) and export bundles (PDF, ZIP, Markdown) must be stored in object storage. These files are written once and read a small number of times (display + download). The system generates potentially thousands of JSON payloads per day and holds exports for 24 hours before expiry.

Options evaluated: Cloudflare R2, AWS S3, Supabase Storage (backed by S3), Backblaze B2.

---

## Decision

Use **Cloudflare R2** for all object storage (stage payloads and exports).

---

## Rationale

**Why R2:**

**Cost — the decisive factor:**
- R2 has **zero egress fees**. S3 charges $0.09/GB for data transfer out to the internet. At scale (thousands of diagram JSON payloads + PDF exports downloaded per day), S3 egress costs compound quickly and unpredictably.
- R2 storage cost is comparable to S3 Standard ($0.015/GB/month vs $0.023/GB/month).
- R2 Class A operations (write) are free up to 1M/month; Class B (read) are free up to 10M/month. Our expected volume is well within free tier for launch.

**S3-compatible API:**
- R2 implements the S3 API fully — the same `@aws-sdk/client-s3` package used for S3 works with R2 by changing the endpoint URL. No new SDK to learn or maintain.
- Pre-signed URLs work identically to S3 — same pattern used for export download links.

**Latency:**
- R2 is served from Cloudflare's global edge — latency to frontend users is lower than S3 for most regions.
- Stage payload writes come from Railway (backend) → R2. Both are global infrastructure; latency is acceptable.

**Why not AWS S3:**
- Egress fees make cost unpredictable at scale — the biggest operational risk for a bootstrapped product.
- No meaningful technical advantage over R2 for our use case (write-once, read-few, short TTL).

**Why not Supabase Storage:**
- Supabase Storage is backed by S3 with egress fees passed through — same cost problem.
- Adds Supabase as a dependency for both DB and storage — concentration risk.

**Why not Backblaze B2:**
- Also S3-compatible and zero egress via Cloudflare partnership — a reasonable alternative.
- R2 preferred because the project already uses Cloudflare for DNS; keeping infrastructure within one provider simplifies operations.

---

## Consequences

- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` must all be set in Railway environment (see `env-vars.md`).
- S3 client must be initialised with R2 endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- Two buckets: `sysdesign-payloads` (stage outputs, no TTL at bucket level — rows deleted by nightly cron) and `sysdesign-exports` (export bundles, 24hr object TTL via R2 lifecycle rules).
- Pre-signed URLs expire after 24 hours — consistent with export TTL in the `exports` DB table.
- R2 does not support S3 event notifications natively — if we need storage-triggered events in future, we'll use R2's Cloudflare Worker trigger or poll from the backend.
- All buckets are **private** — no public access. All object access goes through pre-signed URLs generated server-side. Never expose R2 credentials to the frontend.

---

## Review Trigger

Revisit if: payload sizes grow significantly (e.g. we add image assets to exports) and storage cost becomes material, or if we move infrastructure fully to AWS and consolidation outweighs cost savings.
