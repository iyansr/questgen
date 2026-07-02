import { describe, expect, it } from 'vitest';

import { api } from './helpers/http';

describe('GET /', () => {
  it('returns 200 OK', async () => {
    const res = await api('/');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('OK');
  });
});
