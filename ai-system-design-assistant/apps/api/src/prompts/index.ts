import type { PipelineStage } from '@asdas/shared';

export type PromptTemplate = { system: string; user: (input: string, context?: string) => string };

const BASE_SYSTEM = `You are an expert software architect and technical writer. You produce precise, production-ready documentation. Always respond in well-structured Markdown unless explicitly told otherwise. Be concrete, avoid filler, and make decisions rather than listing options.`;

export const PROMPTS: Record<PipelineStage, PromptTemplate> = {
  requirements: {
    system: `${BASE_SYSTEM} Your task: extract clear, structured functional and non-functional requirements from a product description.`,
    user: (desc) => `Extract requirements from this product description:\n\n${desc}\n\nFormat as:\n## Functional Requirements\n- ...\n## Non-Functional Requirements\n- ...\n## Constraints\n- ...\n## Out of Scope\n- ...`,
  },
  architecture: {
    system: `${BASE_SYSTEM} Your task: design a scalable system architecture given requirements. Include component breakdown, data flow, and deployment topology.`,
    user: (_, ctx) => `Given these requirements:\n\n${ctx}\n\nDesign the system architecture. Include:\n## Architecture Overview\n## Core Components\n## Data Flow\n## Deployment Topology\n## Scalability Considerations`,
  },
  tech_stack: {
    system: `${BASE_SYSTEM} Your task: recommend a concrete, opinionated tech stack. Justify every choice.`,
    user: (_, ctx) => `Given this architecture:\n\n${ctx}\n\nRecommend the tech stack. For each layer specify the exact technology and why:\n## Frontend\n## Backend\n## Database\n## Infrastructure\n## AI/LLM\n## Monitoring & Observability`,
  },
  api_design: {
    system: `${BASE_SYSTEM} Your task: produce a full REST API specification with request/response schemas and error codes.`,
    user: (_, ctx) => `Given this system design:\n\n${ctx}\n\nWrite a full API specification:\n## Base URL & Versioning\n## Authentication\n## Endpoints (method, path, request body, response, errors for each)`,
  },
  db_schema: {
    system: `${BASE_SYSTEM} Your task: produce a complete PostgreSQL database schema with indexes and constraints.`,
    user: (_, ctx) => `Given this system design:\n\n${ctx}\n\nWrite the full DB schema:\n## Tables (with CREATE TABLE SQL)\n## Indexes\n## Relationships & Foreign Keys\n## Migration Notes`,
  },
  user_flows: {
    system: `${BASE_SYSTEM} Your task: map out all user journeys in the application, screen by screen.`,
    user: (_, ctx) => `Given this product:\n\n${ctx}\n\nDocument all user flows:\n## Key User Journeys\n## Screen-by-Screen Flows\n## Error States\n## Edge Cases`,
  },
  prd_trd: {
    system: `${BASE_SYSTEM} Your task: synthesise all prior stages into a polished PRD and TRD.`,
    user: (_, ctx) => `Using all design decisions below, write a complete PRD and TRD:\n\n${ctx}\n\n# Product Requirements Document\n[Write PRD here]\n\n---\n\n# Technical Requirements Document\n[Write TRD here]`,
  },
};
