import ky, { type Hooks, isHTTPError } from 'ky';
import { toast } from 'sonner';

import { useAuthStore } from '@/store/auth';

const BASE_URL = String(import.meta.env.VITE_SERVER_URL);

const hooks: Hooks = {
  beforeRequest: [
    ({ request }) => {
      const token = useAuthStore.getState().token;
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }
    },
  ],
  afterResponse: [
    async ({ response }) => {
      if (response.ok) return;
      try {
        const body = await response.clone().json();
        toast.error(body?.error ?? 'Something went wrong');
      } catch {
        toast.error('Something went wrong');
      }
    },
  ],
  beforeError: [
    async ({ error }) => {
      if (isHTTPError(error)) {
        try {
          const body = await error.response.clone().json();
          if (body?.error) {
            error.message = body.error;
          }
        } catch {}
      }
      return error;
    },
  ],
};

export const api = ky.create({
  prefix: `${BASE_URL}/api`,
  hooks,
});
