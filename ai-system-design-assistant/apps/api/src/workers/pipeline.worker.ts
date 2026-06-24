import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { runDesignPipeline } from '../services/pipeline.service.js';
import { QUEUE_NAMES } from '@asdas/shared';

const worker = new Worker(
  QUEUE_NAMES.DESIGN_PIPELINE,
  async (job) => {
    console.info(`[Worker] Processing job ${job.id} — jobId: ${job.data.jobId}`);
    await runDesignPipeline(job.data.jobId);
    console.info(`[Worker] Completed job ${job.id}`);
  },
  {
    connection: redis,
    concurrency: 3, // max parallel pipeline runs
    limiter: { max: 10, duration: 60_000 }, // 10 jobs/min globally
  },
);

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

worker.on('completed', (job) => {
  console.info(`[Worker] Job ${job.id} done`);
});

console.info('[Worker] Pipeline worker started, waiting for jobs...');
