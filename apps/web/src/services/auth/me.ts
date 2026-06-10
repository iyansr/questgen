import { useQuery } from '@tanstack/react-query';

import { api } from '@/services/fetcher';

import { QUERY_KEYS } from '../api/query-keys';

type MeResponse = {
	user: {
		id: string;
		email: string;
		name: string;
		createdAt: string;
	};
};

export async function getMeService() {
	return api.get('auth/me').json<MeResponse>();
}

export function useMe() {
	return useQuery({
		queryKey: [QUERY_KEYS.AUTH.ME],
		queryFn: getMeService,
		retry: false,
	});
}
