import { useChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { DefaultChatTransport } from 'ai';
import { useEffect, useMemo, useState } from 'react';

import { QUERY_KEYS } from '@/services/api/query-keys';
import { useSession } from '@/services/sessions/detail';
import { useAuthStore } from '@/store/auth';
import type {
  SessionMessage,
  SessionStatus,
  StreamedQuestion,
} from '@/types/session-message';

const SERVER_URL = String(import.meta.env.VITE_SERVER_URL);

export type SessionStreamStatus = {
  status: SessionStatus;
  errorMessage: string | null;
};

const DEFAULT_STATUS: SessionStreamStatus = {
  status: 'pending',
  errorMessage: null,
};

export type UseSessionStreamResult = {
  status: SessionStreamStatus;
  questions: StreamedQuestion[];
  hasInitialData: boolean;
  isStreaming: boolean;
  start: () => void;
};

export function useSessionStream(sessionId: string): UseSessionStreamResult {
  const qc = useQueryClient();

  const { data: initial, isFetched } = useSession(sessionId);

  const [status, setStatus] = useState<SessionStreamStatus>(DEFAULT_STATUS);

  const {
    messages,
    sendMessage,
    status: chatStatus,
  } = useChat<SessionMessage>({
    id: `session-${sessionId}`,
    transport: new DefaultChatTransport({
      api: `${SERVER_URL}/api/sessions/${sessionId}/stream`,
      headers: () => {
        const token = useAuthStore.getState().token;
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
      },
    }),
    onData: (part) => {
      if (part.type === 'data-status') {
        setStatus({
          status: part.data.status as SessionStatus,
          errorMessage: part.data.errorMessage,
        });

        if (part.data.status === 'completed') {
          qc.invalidateQueries({ queryKey: [QUERY_KEYS.SESSIONS.DETAIL] });
          qc.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD.STATS] });
        }
      }
    },
  });

  useEffect(() => {
    if (!isFetched || !initial) return;
    setStatus({
      status: initial.status,
      errorMessage: initial.errorMessage,
    });
  }, [isFetched, initial]);

  useEffect(() => {
    if (!isFetched) return;
    sendMessage({ text: 'start' });
  }, [isFetched, sendMessage]);

  const streamedQuestions = useMemo<StreamedQuestion[]>(() => {
    const byId = new Map<string, StreamedQuestion>();
    for (const message of messages) {
      for (const part of message.parts) {
        if (part.type === 'data-question') {
          byId.set(part.data.id, part.data);
        }
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.order - b.order);
  }, [messages]);

  const isStreaming = chatStatus === 'submitted' || chatStatus === 'streaming';

  const questions = useMemo<StreamedQuestion[]>(() => {
    const fromInitial = () =>
      (initial?.questions ?? []).map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        imageUrl: q.imageUrl,
        options: q.options,
        correctAnswer: q.correctAnswer ?? '',
        suggestedAnswer: q.suggestedAnswer ?? '',
        order: q.order,
      }));

    if (isStreaming && streamedQuestions.length > 0) return streamedQuestions;
    if (isFetched && initial && !isStreaming) return fromInitial();
    if (initial && initial.questions.length > 0) return fromInitial();
    if (streamedQuestions.length > 0) return streamedQuestions;
    return [];
  }, [isStreaming, isFetched, streamedQuestions, initial]);

  return {
    status,
    questions,
    hasInitialData: Boolean(initial),
    isStreaming,
    start: () => sendMessage({ text: 'start' }),
  };
}
