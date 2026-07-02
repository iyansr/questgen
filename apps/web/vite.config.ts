import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Prism language components reference `Prism` as a bare global. Rolldown/Vite 8
 * ESM bundles do not provide that global, which crashes MDXEditor at runtime
 * (e.g. edit-question dialog). See mdx-editor/editor#491 and vitejs/vite#21920.
 */
const prismjsGlobalFix = {
  name: 'prismjs-global-fix',
  transform(code: string, id: string) {
    if (/[/\\]prismjs[/\\]components[/\\]prism-(?!core)/.test(id)) {
      return { code: `import Prism from 'prismjs';\n${code}`, map: null };
    }
  },
};

/** Cloudflare Rocket Loader breaks Vite ES module + dynamic import(). */
const cloudflareRocketLoaderFix = {
  name: 'cloudflare-rocket-loader-fix',
  transformIndexHtml(html: string) {
    return html.replace(
      /<script(?![^>]*data-cfasync)/g,
      '<script data-cfasync="false"',
    );
  },
};

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    prismjsGlobalFix,
    cloudflareRocketLoaderFix,
  ],
});
