'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { STAGE_LABELS, PIPELINE_STAGES, type PipelineStage } from '@asdas/shared';
import type { StageState } from '@/hooks/usePipelineSSE';
import { clsx } from 'clsx';

type Props = { stages: StageState[]; jobStatus: string };

export function ArtifactViewer({ stages, jobStatus }: Props) {
  const stageMap = Object.fromEntries(stages.map((s) => [s.stage, s]));
  const [activeStage, setActiveStage] = useState<PipelineStage>('requirements');

  const active = stageMap[activeStage];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {PIPELINE_STAGES.map((stage) => {
          const s = stageMap[stage];
          const hasContent = s && s.output.length > 0;
          return (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              disabled={!hasContent}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                activeStage === stage
                  ? 'bg-brand text-white'
                  : hasContent
                    ? 'bg-surface-card text-slate-300 hover:bg-surface-border'
                    : 'bg-surface-card text-slate-600 cursor-not-allowed',
              )}
            >
              {STAGE_LABELS[stage].split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 bg-surface-card border border-surface-border rounded-2xl p-6 overflow-auto">
        {!active || active.output.length === 0 ? (
          <p className="text-slate-500 text-sm">Waiting for stage output...</p>
        ) : (
          <div className={clsx(
            'prose prose-invert prose-sm max-w-none',
            active.status === 'processing' && 'cursor-blink',
          )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{active.output}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Meta bar */}
      {active && active.model && (
        <div className="flex items-center gap-4 text-xs text-slate-500 px-1">
          <span>Model: <span className="text-slate-300">{active.model}</span></span>
          {active.tokensUsed && <span>~{active.tokensUsed.toLocaleString()} tokens</span>}
          {active.durationMs && <span>{(active.durationMs / 1000).toFixed(1)}s</span>}
        </div>
      )}
    </div>
  );
}
