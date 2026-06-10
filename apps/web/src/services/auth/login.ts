import { useMutation } from '@tanstack/react-query';

import { api } from '@/services/fetcher';
import { useAuthStore } from '@/store/auth';

type LoginRequest = {
	email: string;
	password: string;
};

type LoginResponse = {
	token: string;
	user: {
		id: string;
		email: string;
		name: string;
	};
};

export async function loginService(data: LoginRequest) {
	return api.post('auth/login', { json: data }).json<LoginResponse>();
}

export function useLogin() {
	const setAuth = useAuthStore((s) => s.setAuth);

	return useMutation({
		mutationFn: loginService,
		onSuccess: (data) => {
			setAuth(data.token, data.user);
		},
	});
}
