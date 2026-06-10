import { useQuery } from '@tanstack/react-query';

import { api } from '@/services/fetcher';

import { QUERY_KEYS } from '../api/query-keys';

export type SessionListItem = {
	id: string;
	userId: string;
	documentId: string | null;
	title: string;
	status: string;
	config: unknown;
	errorMessage: string | null;
	createdAt: string;
	updatedAt: string;
};

export type SessionListResponse = {
	items: SessionListItem[];
	total: number;
	page: number;
	limit: number;
};

export type SessionStatus = 'pending' | 'generating' | 'completed' | 'failed';

export type SessionListParams = {
	page: number;
	limit: number;
	status?: SessionStatus;
	search?: string;
};

export async function getSessionsService(params: SessionListParams) {
	const searchParams: Record<string, string | number> = {
		page: params.page,
		limit: params.limit,
	};
	if (params.status) searchParams.status = params.status;
	if (params.search) searchParams.search = params.search;

	const data = await api
		.get('sessions', { searchParams })
		.json<SessionListResponse>();
	return data;
}

export function useSessions(params: SessionListParams) {
	return useQuery({
		queryKey: [
			QUERY_KEYS.SESSIONS.LIST,
			params.page,
			params.limit,
			params.status ?? null,
			params.search ?? null,
		],
		queryFn: () => getSessionsService(params),
	});
}
