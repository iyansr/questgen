import { createRouter, RouterProvider } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';

import Loader from './components/loader';
import { QueryProvider } from './providers/query-provider';
import { routeTree } from './routeTree.gen';

const CHUNK_RELOAD_KEY = 'questgen-chunk-reload';

function isChunkLoadError(reason: unknown): boolean {
  if (!(reason instanceof Error)) return false;
  const msg = reason.message.toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('error loading dynamically imported module')
  );
}

function reloadOnceForStaleChunk(): void {
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    return;
  }
  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  window.location.reload();
}

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  reloadOnceForStaleChunk();
});

window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) {
    event.preventDefault();
    reloadOnceForStaleChunk();
  }
});

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultPendingComponent: () => <Loader />,
  context: {},
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Root element not found');
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>,
  );
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
}
