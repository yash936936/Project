import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { designJobs, stageResults, artifacts } from '../db/schema.js';
import { designQueue } from '../lib/queue.js';
import { redis } from '../lib/redis.js';
import { MAX_DESCRIPTION_LENGTH, MIN_DESCRIPTION_LENGTH, SSE_HEARTBEAT_INTERVAL_MS } from '@asdas/shared';

const GenerateSchema = z.object({
  description: z.string()
    .min(MIN_DESCRIPTION_LENGTH, `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`)
    .max(MAX_DESCRIPTION_LENGTH, `Description must be under ${MAX_DESCRIPTION_LENGTH} characters`),
  options: z.object({
    techPreferences: z.array(z.string()).optional(),
    scalingTarget: z.enum(['startup', 'growth', 'enterprise']).optional(),
    outputFormat: z.enum(['markdown', 'json']).optional(),
  }).optional(),
});

export const designRoutes: FastifyPluginAsync = async (app) => {

  // POST /api/v1/designs — create new design job
  app.post('/designs', {
    schema: { tags: ['design'], summary: 'Submit a new design generation job' },
  }, async (req, reply) => {
    const parsed = GenerateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { description, options } = parsed.data;
    const jobId = uuidv4();

    await db.insert(designJobs).values({
      id: jobId, description, options: options ?? null, status: 'pending',
    });

    // Push to BullMQ
    await designQueue.add('run-pipeline', { jobId }, { jobId });

    return reply.status(201).send({
      jobId, status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedDuration: 120,
    });
  });

  // GET /api/v1/designs/:jobId — poll job status
  app.get('/designs/:jobId', {
    schema: { tags: ['design'], summary: 'Get job status and artifacts' },
  }, async (req, reply) => {
    const { jobId } = req.params as { jobId: string };

    const job = await db.query.designJobs.findFirst({ where: eq(designJobs.id, jobId) });
    if (!job) return reply.status(404).send({ error: 'Job not found' });

    const stages = await db.query.stageResults.findMany({ where: eq(stageResults.jobId, jobId) });
    const arts = await db.query.artifacts.findMany({ where: eq(artifacts.jobId, jobId) });

    return reply.send({
      jobId: job.id,
      status: job.status,
      currentStage: job.currentStage,
      progress: job.progress,
      error: job.error,
      createdAt: job.createdAt?.toISOString(),
      updatedAt: job.updatedAt?.toISOString(),
      stages: stages.map((s) => ({
        stage: s.stage, status: s.status, model: s.model,
        tokensUsed: s.tokensUsed, durationMs: s.durationMs,
        startedAt: s.startedAt?.toISOString(), completedAt: s.completedAt?.toISOString(),
      })),
      artifacts: arts.map((a) => ({
        id: a.id, type: a.type, title: a.title,
        content: a.content, url: a.publicUrl,
        mimeType: a.mimeType, sizeBytes: a.sizeBytes,
        createdAt: a.createdAt?.toISOString(),
      })),
    });
  });

  // GET /api/v1/designs/:jobId/stream — SSE live stream
  app.get('/designs/:jobId/stream', {
    schema: { tags: ['design'], summary: 'SSE stream for real-time pipeline events' },
  }, async (req, reply) => {
    const { jobId } = req.params as { jobId: string };

    const job = await db.query.designJobs.findFirst({ where: eq(designJobs.id, jobId) });
    if (!job) return reply.status(404).send({ error: 'Job not found' });

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('X-Accel-Buffering', 'no');
    reply.raw.flushHeaders();

    const sendEvent = (event: string, data: unknown) => {
      if (reply.raw.destroyed) return;
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Heartbeat
    const heartbeat = setInterval(() => sendEvent('heartbeat', { ts: Date.now() }), SSE_HEARTBEAT_INTERVAL_MS);

    // Subscribe to Redis pub/sub channel
    const sub = redis.duplicate();
    await sub.subscribe(`sse:${jobId}`);

    sub.on('message', (_channel, message) => {
      try {
        const parsed = JSON.parse(message);
        sendEvent(parsed.event, parsed.data);
        if (parsed.event === 'job:complete' || parsed.event === 'job:error') {
          cleanup();
        }
      } catch { /* ignore */ }
    });

    const cleanup = () => {
      clearInterval(heartbeat);
      sub.unsubscribe(`sse:${jobId}`).catch(() => {});
      sub.disconnect();
      if (!reply.raw.destroyed) reply.raw.end();
    };

    req.raw.on('close', cleanup);
    req.raw.on('error', cleanup);

    // If job already done, send final event and close
    if (job.status === 'completed' || job.status === 'failed') {
      sendEvent(`job:${job.status}`, { jobId, status: job.status });
      cleanup();
    }

    return reply;
  });

  // GET /api/v1/designs — list recent jobs (simple, no auth yet)
  app.get('/designs', {
    schema: { tags: ['design'], summary: 'List recent design jobs' },
  }, async (req, reply) => {
    const jobs = await db.query.designJobs.findMany({
      orderBy: (j, { desc }) => [desc(j.createdAt)],
      limit: 20,
    });
    return reply.send({
      jobs: jobs.map((j) => ({
        jobId: j.id, status: j.status, progress: j.progress,
        description: j.description.slice(0, 120),
        createdAt: j.createdAt?.toISOString(),
      })),
    });
  });
};
