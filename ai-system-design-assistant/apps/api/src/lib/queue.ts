import { Queue } from 'bullmq';
import { redis } from './redis.js';
import { QUEUE_NAMES } from '@asdas/shared';

export const designQueue = new Queue(QUEUE_NAMES.DESIGN_PIPELINE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 72 },
  },
});
