import { LangfuseSpanProcessor } from '@langfuse/otel';
import { trace } from '@opentelemetry/api';
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';
import { env } from '@questgen/env/server';

let processor: LangfuseSpanProcessor | null = null;
let initialized = false;

export function initTracing(): void {
  if (initialized) return;
  initialized = true;

  processor = new LangfuseSpanProcessor({
    publicKey: env.LANGFUSE_PUBLIC_KEY,
    secretKey: env.LANGFUSE_SECRET_KEY,
    baseUrl: env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
    exportMode: 'immediate',
  });

  const provider = new BasicTracerProvider({
    spanProcessors: [processor],
  });

  trace.setGlobalTracerProvider(provider);
}

export async function flushTracing(): Promise<void> {
  if (processor) {
    await processor.forceFlush();
  }
}
