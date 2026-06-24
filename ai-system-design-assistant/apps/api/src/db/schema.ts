import { pgTable, text, timestamp, integer, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';

export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed']);
export const stageStatusEnum = pgEnum('stage_status', ['pending', 'processing', 'completed', 'failed']);
export const artifactTypeEnum = pgEnum('artifact_type', [
  'prd', 'trd', 'architecture_diagram', 'api_spec', 'db_schema', 'user_flow', 'tech_stack',
]);

// ─── design_jobs ─────────────────────────────────────────────────────────────
export const designJobs = pgTable('design_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  description: text('description').notNull(),
  options: jsonb('options'),
  status: jobStatusEnum('status').notNull().default('pending'),
  currentStage: text('current_stage'),
  progress: integer('progress').notNull().default(0),
  totalTokensUsed: integer('total_tokens_used').notNull().default(0),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

// ─── stage_results ────────────────────────────────────────────────────────────
export const stageResults = pgTable('stage_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => designJobs.id, { onDelete: 'cascade' }),
  stage: text('stage').notNull(),
  status: stageStatusEnum('status').notNull().default('pending'),
  model: text('model'),
  tokensUsed: integer('tokens_used'),
  durationMs: integer('duration_ms'),
  rawOutput: text('raw_output'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
});

// ─── artifacts ────────────────────────────────────────────────────────────────
export const artifacts = pgTable('artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => designJobs.id, { onDelete: 'cascade' }),
  type: artifactTypeEnum('type').notNull(),
  title: text('title').notNull(),
  content: text('content'),         // inline for small artifacts
  r2Key: text('r2_key'),            // R2 object key for large artifacts
  publicUrl: text('public_url'),
  mimeType: text('mime_type').notNull().default('text/markdown'),
  sizeBytes: integer('size_bytes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type DesignJob = typeof designJobs.$inferSelect;
export type NewDesignJob = typeof designJobs.$inferInsert;
export type StageResult = typeof stageResults.$inferSelect;
export type Artifact = typeof artifacts.$inferSelect;
