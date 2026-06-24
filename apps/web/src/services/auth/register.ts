import { useMutation } from '@tanstack/react-query';

import { api } from '@/services/fetcher';
import { useAuthStore } from '@/store/auth';

type RegisterRequest = {
  email: string;
  password: string;
  name: string;
};

type RegisterResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export async function registerService(data: RegisterRequest) {
  return api.post('auth/register', { json: data }).json<RegisterResponse>();
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: registerService,
    onSuccess: (data) => {
      setAuth(data.token, data.user);
    },
  });
}
