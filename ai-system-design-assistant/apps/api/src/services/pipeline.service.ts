import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { designJobs, stageResults, artifacts } from '../db/schema.js';
import { streamCompletion } from '../lib/llm.js';
import { uploadArtifact } from '../lib/r2.js';
import { redis } from '../lib/redis.js';
import { PROMPTS } from '../prompts/index.js';
import {
  PIPELINE_STAGES,
  type PipelineStage,
  type SSEEventType,
} from '@asdas/shared';

const ARTIFACT_SIZE_THRESHOLD = 10_000; // bytes — above this, push to R2

// ─── SSE Publisher ────────────────────────────────────────────────────────────
async function publishSSE(jobId: string, event: SSEEventType, data: unknown) {
  const payload = JSON.stringify({ event, data, id: uuidv4(), ts: Date.now() });
  await redis.publish(`sse:${jobId}`, payload);
}

// ─── Main Pipeline Runner ─────────────────────────────────────────────────────
export async function runDesignPipeline(jobId: string): Promise<void> {
  const job = await db.query.designJobs.findFirst({ where: eq(designJobs.id, jobId) });
  if (!job) throw new Error(`Job not found: ${jobId}`);

  await db.update(designJobs).set({ status: 'processing', updatedAt: new Date() }).where(eq(designJobs.id, jobId));

  const stageOutputs: Partial<Record<PipelineStage, string>> = {};
  const stageCount = PIPELINE_STAGES.length;
  let totalTokens = 0;
  const jobStartMs = Date.now();

  for (let i = 0; i < stageCount; i++) {
    const stage = PIPELINE_STAGES[i];
    const stageStartMs = Date.now();

    // Update job progress
    await db.update(designJobs).set({
      currentStage: stage,
      progress: Math.round((i / stageCount) * 100),
      updatedAt: new Date(),
    }).where(eq(designJobs.id, jobId));

    // Insert stage row
    await db.insert(stageResults).values({
      jobId, stage, status: 'processing', startedAt: new Date(),
    }).onConflictDoNothing();

    await publishSSE(jobId, 'stage:start', {
      jobId, stage, stageIndex: i, totalStages: stageCount,
    });

    // Build context from previous stages
    const context = Object.entries(stageOutputs)
      .map(([s, o]) => `## ${s.toUpperCase()}\n${o}`)
      .join('\n\n---\n\n');

    const prompt = PROMPTS[stage];
    let fullOutput = '';
    let stageTokens = 0;
    let modelUsed = 'unknown';

    try {
      const { stream, model } = await streamCompletion(
        prompt.system,
        prompt.user(job.description, context || job.description),
        4096,
      );
      modelUsed = model;

      for await (const token of stream) {
        fullOutput += token;
        stageTokens += token.length / 4; // rough token estimate
        await publishSSE(jobId, 'stage:token', { jobId, stage, token });
      }

      stageOutputs[stage] = fullOutput;
      totalTokens += Math.round(stageTokens);

      // Upload large artifacts to R2
      const sizeBytes = Buffer.byteLength(fullOutput, 'utf-8');
      let artifactUrl: string | undefined;
      let artifactContent: string | undefined;

      if (sizeBytes > ARTIFACT_SIZE_THRESHOLD) {
        const key = `${jobId}/${stage}.md`;
        artifactUrl = await uploadArtifact(key, fullOutput);
      } else {
        artifactContent = fullOutput;
      }

      const artifactId = uuidv4();
      await db.insert(artifacts).values({
        id: artifactId, jobId,
        type: stageToArtifactType(stage),
        title: stageToTitle(stage),
        content: artifactContent,
        publicUrl: artifactUrl,
        r2Key: artifactUrl ? `${jobId}/${stage}.md` : undefined,
        mimeType: 'text/markdown',
        sizeBytes,
      });

      const durationMs = Date.now() - stageStartMs;
      await db.update(stageResults).set({
        status: 'completed',
        model: modelUsed,
        tokensUsed: Math.round(stageTokens),
        durationMs,
        rawOutput: fullOutput.slice(0, 2000), // store first 2KB for quick preview
        completedAt: new Date(),
      }).where(eq(stageResults.jobId, jobId));

      await publishSSE(jobId, 'stage:complete', {
        jobId, stage,
        result: { stage, status: 'completed', durationMs, tokensUsed: Math.round(stageTokens), model: modelUsed },
        artifact: { id: artifactId, type: stageToArtifactType(stage), title: stageToTitle(stage),
          url: artifactUrl, mimeType: 'text/markdown', sizeBytes, createdAt: new Date().toISOString() },
      });

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await db.update(stageResults).set({ status: 'failed', completedAt: new Date() })
        .where(eq(stageResults.jobId, jobId));
      await db.update(designJobs).set({ status: 'failed', error: errMsg, updatedAt: new Date() })
        .where(eq(designJobs.id, jobId));
      await publishSSE(jobId, 'stage:error', { jobId, stage, error: errMsg });
      throw err;
    }
  }

  // ─── Job Complete ─────────────────────────────────────────────────────────
  const allArtifacts = await db.query.artifacts.findMany({ where: eq(artifacts.jobId, jobId) });

  await db.update(designJobs).set({
    status: 'completed',
    progress: 100,
    totalTokensUsed: totalTokens,
    currentStage: null,
    completedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(designJobs.id, jobId));

  await publishSSE(jobId, 'job:complete', {
    jobId,
    artifacts: allArtifacts.map((a) => ({
      id: a.id, type: a.type, title: a.title,
      url: a.publicUrl, mimeType: a.mimeType, sizeBytes: a.sizeBytes,
      createdAt: a.createdAt?.toISOString(),
    })),
    totalDurationMs: Date.now() - jobStartMs,
    totalTokensUsed: totalTokens,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stageToArtifactType(stage: PipelineStage) {
  const map: Record<PipelineStage, string> = {
    requirements: 'prd', architecture: 'architecture_diagram',
    tech_stack: 'tech_stack', api_design: 'api_spec',
    db_schema: 'db_schema', user_flows: 'user_flow', prd_trd: 'trd',
  };
  return map[stage] as any;
}

function stageToTitle(stage: PipelineStage) {
  const map: Record<PipelineStage, string> = {
    requirements: 'Requirements Analysis',
    architecture: 'System Architecture',
    tech_stack: 'Tech Stack Recommendations',
    api_design: 'API Specification',
    db_schema: 'Database Schema',
    user_flows: 'User Flows',
    prd_trd: 'PRD & TRD',
  };
  return map[stage];
}
