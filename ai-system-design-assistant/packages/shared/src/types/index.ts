// ─── Core Domain Types ────────────────────────────────────────────────────────

export type PipelineStage =
  | 'requirements'
  | 'architecture'
  | 'tech_stack'
  | 'api_design'
  | 'db_schema'
  | 'user_flows'
  | 'prd_trd';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ArtifactType =
  | 'prd'
  | 'trd'
  | 'architecture_diagram'
  | 'api_spec'
  | 'db_schema'
  | 'user_flow'
  | 'tech_stack';

// ─── API Request / Response Schemas ──────────────────────────────────────────

export interface GenerateDesignRequest {
  description: string;
  options?: {
    techPreferences?: string[];
    scalingTarget?: 'startup' | 'growth' | 'enterprise';
    outputFormat?: 'markdown' | 'json';
  };
}

export interface GenerateDesignResponse {
  jobId: string;
  status: JobStatus;
  createdAt: string;
  estimatedDuration: number;
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  currentStage: PipelineStage | null;
  progress: number;
  stages: StageResult[];
  artifacts?: Artifact[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StageResult {
  stage: PipelineStage;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  tokensUsed?: number;
  model?: string;
}

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content?: string;
  url?: string;
  mimeType: string;
  sizeBytes?: number;
  createdAt: string;
}

// ─── SSE Event Types ──────────────────────────────────────────────────────────

export type SSEEventType =
  | 'stage:start'
  | 'stage:token'
  | 'stage:complete'
  | 'stage:error'
  | 'job:complete'
  | 'job:error'
  | 'heartbeat';

export interface SSEEvent<T = unknown> {
  event: SSEEventType;
  data: T;
  id?: string;
}

export interface StageStartEvent {
  jobId: string;
  stage: PipelineStage;
  stageIndex: number;
  totalStages: number;
}

export interface StageTokenEvent {
  jobId: string;
  stage: PipelineStage;
  token: string;
}

export interface StageCompleteEvent {
  jobId: string;
  stage: PipelineStage;
  result: StageResult;
  artifact?: Artifact;
}

export interface JobCompleteEvent {
  jobId: string;
  artifacts: Artifact[];
  totalDurationMs: number;
  totalTokensUsed: number;
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export const PIPELINE_STAGES: PipelineStage[] = [
  'requirements',
  'architecture',
  'tech_stack',
  'api_design',
  'db_schema',
  'user_flows',
  'prd_trd',
];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  requirements: 'Extracting Requirements',
  architecture: 'Designing Architecture',
  tech_stack: 'Recommending Tech Stack',
  api_design: 'Specifying API Design',
  db_schema: 'Generating DB Schema',
  user_flows: 'Mapping User Flows',
  prd_trd: 'Writing PRD & TRD',
};
