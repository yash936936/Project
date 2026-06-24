export const PIPELINE_STAGE_COUNT = 7;
export const SSE_HEARTBEAT_INTERVAL_MS = 15_000;
export const JOB_TTL_MS = 1000 * 60 * 60 * 24;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MIN_DESCRIPTION_LENGTH = 20;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const QUEUE_NAMES = {
  DESIGN_PIPELINE: 'design-pipeline',
} as const;

export const REDIS_KEY_PREFIXES = {
  JOB: 'job:',
  SSE: 'sse:',
  RATE_LIMIT: 'rl:',
} as const;
