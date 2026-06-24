/// <reference types="@cloudflare/workers-types" />

interface QuestgenEnv {
  // Bindings (declared in wrangler.jsonc)
  DOCUMENTS_BUCKET: R2Bucket;
  GENERATION_WORKFLOW: Workflow;

  // Plain vars (set in Cloudflare dashboard for production, .env for local dev)
  CORS_ORIGIN: string;
  SERVER_URL?: string;
  R2_PUBLIC_HOST?: string;
  CHROMA_TENANT: string;
  CHROMA_DATABASE: string;
  CHROMA_URL?: string;

  // Optional model overrides
  QUESTGEN_GENERATION_MODEL?: string;
  QUESTGEN_RESEARCH_MODEL?: string;
  QUESTGEN_RETRIEVAL_MODEL?: string;
  QUESTGEN_CAPTIONING_MODEL?: string;
  QUESTGEN_TITLE_MODEL?: string;
  QUESTGEN_EMBEDDING_MODEL?: string;

  OPENCODE_API_KEY?: string;

  // Secrets (set via `wrangler secret put` for production, .env for local dev)
  DATABASE_URL: string;
  JWT_SECRET: string;
  CHROMA_API_KEY?: string;
  OPENROUTER_API_KEY: string;
  MISTRAL_API_KEY: string;
  TAVILY_API_KEY: string;
  LANGFUSE_PUBLIC_KEY: string;
  LANGFUSE_SECRET_KEY: string;
  LANGFUSE_BASE_URL?: string;
}

declare global {
  interface Env extends QuestgenEnv {}
}

declare module 'cloudflare:workers' {
  namespace Cloudflare {
    interface Env extends QuestgenEnv {}
  }
}

export {};
