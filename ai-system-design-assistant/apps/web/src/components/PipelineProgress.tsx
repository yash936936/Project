'use client';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { STAGE_LABELS, PIPELINE_STAGES, type PipelineStage } from '@asdas/shared';
import type { StageState } from '@/hooks/usePipelineSSE';
import { clsx } from 'clsx';

type Props = {
  stages: StageState[];
  currentStage: PipelineStage | null;
  jobStatus: string;
};

export function PipelineProgress({ stages, currentStage, jobStatus }: Props) {
  const stageMap = Object.fromEntries(stages.map((s) => [s.stage, s]));

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Pipeline Progress</p>
      {PIPELINE_STAGES.map((stage, i) => {
        const s = stageMap[stage];
        const status = s?.status ?? 'pending';

        return (
          <div key={stage} className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            status === 'processing' && 'bg-brand/10 text-white',
            status === 'completed' && 'text-slate-400',
            status === 'failed' && 'bg-red-900/20 text-red-400',
            status === 'pending' && 'text-slate-600',
          )}>
            <span className="text-xs w-4 font-mono text-slate-600">{i + 1}</span>
            {status === 'completed' && <CheckCircle2 size={14} className="text-green-400 shrink-0" />}
            {status === 'processing' && <Loader2 size={14} className="text-brand animate-spin shrink-0" />}
            {status === 'failed' && <XCircle size={14} className="text-red-400 shrink-0" />}
            {status === 'pending' && <Circle size={14} className="shrink-0" />}
            <span className="truncate">{STAGE_LABELS[stage]}</span>
            {s?.durationMs && status === 'completed' && (
              <span className="ml-auto text-xs text-slate-600">{(s.durationMs / 1000).toFixed(1)}s</span>
            )}
          </div>
        );
      })}
      {jobStatus === 'completed' && (
        <p className="text-xs text-green-400 text-center pt-2 font-medium">✓ Design generation complete</p>
      )}
    </div>
  );
}
