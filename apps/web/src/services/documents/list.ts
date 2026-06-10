import { useQuery } from '@tanstack/react-query';

import { api } from '@/services/fetcher';

import { QUERY_KEYS } from '../api/query-keys';

export type DocumentListItem = {
	id: string;
	filename: string;
	createdAt: string;
};

export type DocumentListResponse = {
	items: DocumentListItem[];
};

export async function getReadyDocumentsService(): Promise<DocumentListResponse> {
	return api.get('documents').json<DocumentListResponse>();
}

export function useReadyDocuments() {
	return useQuery({
		queryKey: [QUERY_KEYS.DOCUMENTS.LIST],
		queryFn: getReadyDocumentsService,
	});
}
