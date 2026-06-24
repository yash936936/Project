'use client';
import { useState } from 'react';
import { submitDesign } from '@/lib/api';
import { usePipelineSSE } from '@/hooks/usePipelineSSE';
import { PipelineProgress } from '@/components/PipelineProgress';
import { ArtifactViewer } from '@/components/ArtifactViewer';
import { Zap, Loader2 } from 'lucide-react';
import { MAX_DESCRIPTION_LENGTH, MIN_DESCRIPTION_LENGTH } from '@asdas/shared';

export default function DesignPage() {
  const [description, setDescription] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sseState = usePipelineSSE(jobId);

  const handleSubmit = async () => {
    if (description.length < MIN_DESCRIPTION_LENGTH) {
      setError(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { jobId: id } = await submitDesign({ description });
      setJobId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start job');
    } finally {
      setSubmitting(false);
    }
  };

  const isRunning = sseState.jobStatus === 'processing';
  const isDone = sseState.jobStatus === 'completed';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-border px-6 py-4 flex items-center gap-3">
        <div className="p-1.5 bg-brand/10 rounded-lg"><Zap size={18} className="text-brand" /></div>
        <span className="font-semibold text-white">AI System Design Assistant</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Input */}
        <aside className="w-96 border-r border-surface-border flex flex-col p-6 gap-4 shrink-0">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Product Description</label>
            <textarea
              className="w-full h-56 bg-surface-card border border-surface-border rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
              placeholder="Describe your product... e.g. 'A SaaS platform for restaurant chains to manage inventory, staff schedules, and POS integrations with real-time analytics dashboard...'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isRunning}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            <p className="text-right text-xs text-slate-500 mt-1">{description.length}/{MAX_DESCRIPTION_LENGTH}</p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm rounded-lg p-3">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || isRunning || description.length < MIN_DESCRIPTION_LENGTH}
            className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {submitting || isRunning
              ? <><Loader2 size={16} className="animate-spin" /> {isRunning ? 'Running pipeline...' : 'Starting...'}</>
              : <><Zap size={16} /> Generate System Design</>
            }
          </button>

          {jobId && (
            <div>
              <PipelineProgress stages={sseState.stages} currentStage={sseState.currentStage} jobStatus={sseState.jobStatus} />
            </div>
          )}
        </aside>

        {/* Right: Output */}
        <main className="flex-1 overflow-auto p-6">
          {!jobId && (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Your system design artifacts will appear here
            </div>
          )}
          {jobId && (
            <ArtifactViewer stages={sseState.stages} jobStatus={sseState.jobStatus} />
          )}
        </main>
      </div>
    </div>
  );
}
