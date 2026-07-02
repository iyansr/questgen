import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.test.jsonc' },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  test: {
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts'],
    testTimeout: 30_000,
    fileParallelism: false,
    maxWorkers: 1,
    deps: {
      optimizer: {
        ssr: {
          include: ['pg', 'pg-protocol', 'pg-connection-string'],
        },
      },
    },
    server: {
      deps: {
        inline: ['pg', 'pg-protocol', 'pg-connection-string'],
      },
    },
  },
  ssr: {
    noExternal: ['pg', 'pg-protocol', 'pg-connection-string'],
  },
});
