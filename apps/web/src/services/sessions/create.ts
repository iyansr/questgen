import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/services/fetcher';

import { QUERY_KEYS } from '../api/query-keys';

export type CreateSessionInput = {
  topic: string;
  questionTypeCounts: Array<{ type: string; count: number }>;
  file?: File;
  documentId?: string;
  webQuery?: string;
  curriculum?: string;
  grade?: string;
  classGrade?: string;
};

export type CreateSessionResponse = {
  id: string;
};

function toFormData(input: CreateSessionInput): FormData {
  const formData = new FormData();
  formData.set('topic', input.topic);
  formData.set('questionTypeCounts', JSON.stringify(input.questionTypeCounts));
  if (input.file) formData.set('file', input.file);
  if (input.documentId) formData.set('documentId', input.documentId);
  if (input.webQuery) formData.set('webQuery', input.webQuery);
  if (input.curriculum) formData.set('curriculum', input.curriculum);
  if (input.grade) formData.set('grade', input.grade);
  if (input.classGrade) formData.set('classGrade', input.classGrade);
  return formData;
}

export async function createSessionService(
  input: CreateSessionInput,
): Promise<CreateSessionResponse> {
  return api
    .post('sessions', { body: toFormData(input) })
    .json<CreateSessionResponse>();
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSessionService,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SESSIONS.LIST],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DASHBOARD.STATS],
      });
    },
  });
}
