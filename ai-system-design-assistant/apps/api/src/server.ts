import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { designRoutes } from './routes/design.js';
import { healthRoutes } from './routes/health.js';
import { redis } from './lib/redis.js';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty' }
        : undefined,
  },
});

// ─── Plugins ──────────────────────────────────────────────────────────────────

await app.register(helmet, { contentSecurityPolicy: false });

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
});

await app.register(rateLimit, {
  max: Number(process.env.RATE_LIMIT_MAX ?? 10),
  timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  redis,
  keyGenerator: (req) => req.ip,
});

await app.register(swagger, {
  openapi: {
    info: { title: 'AI System Design Assistant API', version: '1.0.0' },
    tags: [
      { name: 'design', description: 'Design generation pipeline' },
      { name: 'health', description: 'Health checks' },
    ],
  },
});

await app.register(swaggerUi, { routePrefix: '/docs' });

// ─── Routes ───────────────────────────────────────────────────────────────────

await app.register(healthRoutes, { prefix: '/api/v1' });
await app.register(designRoutes, { prefix: '/api/v1' });

// ─── Boot ─────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 3001);

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  app.log.info(`API ready on http://0.0.0.0:${PORT}`);
  app.log.info(`Swagger UI: http://0.0.0.0:${PORT}/docs`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
