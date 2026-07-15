import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/services/fetcher';

import { QUERY_KEYS } from '../api/query-keys';

export type DeleteSessionInput = {
  sessionId: string;
};

export type DeleteSessionResponse = {
  deleted: number;
};

export async function deleteSessionService(
  input: DeleteSessionInput,
): Promise<DeleteSessionResponse> {
  return api
    .delete(`sessions/${input.sessionId}`)
    .json<DeleteSessionResponse>();
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSessionService,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SESSIONS.LIST],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DASHBOARD.STATS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SESSIONS.DETAIL, variables.sessionId],
      });
    },
  });
}
