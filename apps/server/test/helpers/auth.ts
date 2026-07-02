import { api, readJson } from './http';

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type AuthBody = {
  token: string;
  user: AuthUser;
};

export async function registerUser(
  email: string,
  password = 'password123',
  name = 'Test User',
) {
  const res = await api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  return { res, body: await readJson<AuthBody>(res) };
}

export async function loginUser(
  email: string,
  password = 'password123',
) {
  const res = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return { res, body: await readJson<AuthBody>(res) };
}

export async function registerAndGetToken(email: string) {
  const { body } = await registerUser(email);
  return body.token;
}
