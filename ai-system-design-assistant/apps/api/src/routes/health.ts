import type { FastifyPluginAsync } from 'fastify';
import { redis } from '../lib/redis.js';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', { schema: { tags: ['health'] } }, async (_, reply) => {
    const checks: Record<string, string> = {};

    // DB check
    try {
      await db.execute(sql`SELECT 1`);
      checks.db = 'ok';
    } catch { checks.db = 'error'; }

    // Redis check
    try {
      await redis.ping();
      checks.redis = 'ok';
    } catch { checks.redis = 'error'; }

    const healthy = Object.values(checks).every((v) => v === 'ok');
    return reply.status(healthy ? 200 : 503).send({
      status: healthy ? 'healthy' : 'degraded',
      checks,
      ts: new Date().toISOString(),
    });
  });
};
