import { exports } from 'cloudflare:workers';

const BASE_URL = 'http://localhost';

export type ApiInit = RequestInit & {
  token?: string;
};

export async function api(path: string, init: ApiInit = {}) {
  const headers = new Headers(init.headers);
  if (init.token) {
    headers.set('Authorization', `Bearer ${init.token}`);
  }

  return exports.default.fetch(
    new Request(`${BASE_URL}${path}`, { ...init, headers }),
  );
}

export async function readJson<T = unknown>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}
