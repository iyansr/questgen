import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/services/fetcher';

import { QUERY_KEYS } from '../api/query-keys';

export type EditOption = {
  label: string;
  text: string;
};

export type QuestionPatch = {
  id: string;
  questionText: string;
  options: EditOption[] | null;
  correctAnswer: string;
  suggestedAnswer: string | null;
  removeImage?: boolean;
};

export type UpdateQuestionsInput = {
  sessionId: string;
  patches: QuestionPatch[];
  images: Array<{ questionId: string; file: File }>;
};

export type UpdateQuestionsResponse = {
  updated: number;
  imagesUploaded: number;
  imagesRemoved: number;
};

function toFormData(input: UpdateQuestionsInput): FormData {
  const formData = new FormData();
  formData.set('updates', JSON.stringify(input.patches));
  for (const { questionId, file } of input.images) {
    formData.set(`image_${questionId}`, file);
  }
  return formData;
}

export async function updateQuestionsService(
  input: UpdateQuestionsInput,
): Promise<UpdateQuestionsResponse> {
  return api
    .patch(`sessions/${input.sessionId}/questions`, {
      body: toFormData(input),
    })
    .json<UpdateQuestionsResponse>();
}

export function useUpdateQuestions(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateQuestionsService,
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
