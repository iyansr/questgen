import { useQuery } from '@tanstack/react-query';

import { api } from '@/services/fetcher';

import { QUERY_KEYS } from '../api/query-keys';

export type SessionStatus = 'pending' | 'generating' | 'completed' | 'failed';

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'essay';

export type QuestionOption = {
  label: string;
  text: string;
};

export type SessionConfig = {
  topic: string;
  questionTypeCounts: Array<{ type: QuestionType; count: number }>;
  count: number;
  curriculum?: string;
  grade?: string;
  classGrade?: string;
};

export type SessionQuestion = {
  id: string;
  setId: string;
  questionText: string;
  questionType: QuestionType;
  imageUrl: string | null;
  suggestedAnswer: string | null;
  correctAnswer: string | null;
  options: QuestionOption[] | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type SessionDetail = {
  id: string;
  userId: string;
  documentId: string | null;
  title: string;
  status: SessionStatus;
  config: SessionConfig;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  questions: SessionQuestion[];
};

export async function getSessionService(id: string): Promise<SessionDetail> {
  return api.get(`sessions/${id}`).json<SessionDetail>();
}

export function useSession(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.SESSIONS.DETAIL, id],
    queryFn: () => getSessionService(id),
    enabled: Boolean(id),
  });
}
