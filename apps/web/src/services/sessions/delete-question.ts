import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/services/fetcher';

import { QUERY_KEYS } from '../api/query-keys';

export type DeleteQuestionInput = {
  sessionId: string;
  questionId: string;
};

export type DeleteQuestionResponse = {
  deleted: number;
};

export async function deleteQuestionService(
  input: DeleteQuestionInput,
): Promise<DeleteQuestionResponse> {
  return api
    .delete(`sessions/${input.sessionId}/questions/${input.questionId}`)
    .json<DeleteQuestionResponse>();
}

export function useDeleteQuestion(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestionService,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SESSIONS.DETAIL, sessionId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DASHBOARD.STATS],
      });
    },
  });
}
