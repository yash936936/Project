'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { createSSEConnection } from '@/lib/api';
import type {
  PipelineStage, SSEEventType,
  StageStartEvent, StageTokenEvent, StageCompleteEvent, JobCompleteEvent,
} from '@asdas/shared';

export type StageState = {
  stage: PipelineStage;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output: string;
  model?: string;
  tokensUsed?: number;
  durationMs?: number;
};

export type SSEState = {
  connected: boolean;
  stages: StageState[];
  currentStage: PipelineStage | null;
  jobStatus: 'idle' | 'processing' | 'completed' | 'failed';
  error: string | null;
};

const INITIAL_STATE: SSEState = {
  connected: false, stages: [], currentStage: null,
  jobStatus: 'idle', error: null,
};

export function usePipelineSSE(jobId: string | null) {
  const [state, setState] = useState<SSEState>(INITIAL_STATE);
  const esRef = useRef<EventSource | null>(null);

  const updateStage = useCallback((stage: PipelineStage, patch: Partial<StageState>) => {
    setState((prev) => ({
      ...prev,
      stages: prev.stages.map((s) => s.stage === stage ? { ...s, ...patch } : s),
    }));
  }, []);

  useEffect(() => {
    if (!jobId) return;
    setState(INITIAL_STATE);

    const es = createSSEConnection(jobId);
    esRef.current = es;
    setState((p) => ({ ...p, connected: true }));

    es.addEventListener('stage:start', (e) => {
      const d: StageStartEvent = JSON.parse((e as MessageEvent).data);
      setState((prev) => {
        const exists = prev.stages.find((s) => s.stage === d.stage);
        return {
          ...prev,
          currentStage: d.stage,
          jobStatus: 'processing',
          stages: exists
            ? prev.stages.map((s) => s.stage === d.stage ? { ...s, status: 'processing' } : s)
            : [...prev.stages, { stage: d.stage, status: 'processing', output: '' }],
        };
      });
    });

    es.addEventListener('stage:token', (e) => {
      const d: StageTokenEvent = JSON.parse((e as MessageEvent).data);
      setState((prev) => ({
        ...prev,
        stages: prev.stages.map((s) =>
          s.stage === d.stage ? { ...s, output: s.output + d.token } : s
        ),
      }));
    });

    es.addEventListener('stage:complete', (e) => {
      const d: StageCompleteEvent = JSON.parse((e as MessageEvent).data);
      updateStage(d.stage, {
        status: 'completed', model: d.result.model,
        tokensUsed: d.result.tokensUsed, durationMs: d.result.durationMs,
      });
    });

    es.addEventListener('stage:error', (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      updateStage(d.stage, { status: 'failed' });
    });

    es.addEventListener('job:complete', (e) => {
      const _d: JobCompleteEvent = JSON.parse((e as MessageEvent).data);
      setState((p) => ({ ...p, jobStatus: 'completed', currentStage: null, connected: false }));
      es.close();
    });

    es.addEventListener('job:error', (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setState((p) => ({ ...p, jobStatus: 'failed', error: d.error, connected: false }));
      es.close();
    });

    es.onerror = () => {
      setState((p) => ({ ...p, connected: false }));
    };

    return () => { es.close(); };
  }, [jobId, updateStage]);

  return state;
}
