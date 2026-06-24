import type { GenerateDesignRequest, GenerateDesignResponse, JobStatusResponse } from '@asdas/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export async function submitDesign(body: GenerateDesignRequest): Promise<GenerateDesignResponse> {
  const res = await fetch(`${API_BASE}/designs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${API_BASE}/designs/${jobId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function createSSEConnection(jobId: string): EventSource {
  return new EventSource(`${API_BASE}/designs/${jobId}/stream`);
}
