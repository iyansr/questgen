import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/services/fetcher';
import type { QuestionType } from '@/types/session-message';

import { QUERY_KEYS } from '../api/query-keys';

export type CreateOption = {
  label: string;
  text: string;
};

export type CreateQuestionInput = {
  sessionId: string;
  questionType: QuestionType;
  questionText: string;
  options: CreateOption[] | null;
  correctAnswer: string;
  suggestedAnswer: string | null;
  imageFile?: File | null;
};

export type CreatedQuestion = {
  id: string;
  setId: string;
  questionText: string;
  questionType: QuestionType;
  imageUrl: string | null;
  options: CreateOption[] | null;
  correctAnswer: string | null;
  suggestedAnswer: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

function toFormData(input: CreateQuestionInput): FormData {
  const formData = new FormData();
  formData.set('questionType', input.questionType);
  formData.set('questionText', input.questionText);
  formData.set('options', JSON.stringify(input.options));
  formData.set('correctAnswer', input.correctAnswer);
  formData.set('suggestedAnswer', input.suggestedAnswer ?? '');
  if (input.imageFile) {
    formData.set('image', input.imageFile);
  }
  return formData;
}

export async function createQuestionService(
  input: CreateQuestionInput,
): Promise<CreatedQuestion> {
  return api
    .post(`sessions/${input.sessionId}/questions`, {
      body: toFormData(input),
    })
    .json<CreatedQuestion>();
}

export function useCreateQuestion(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuestionService,
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
