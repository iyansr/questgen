import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/services/fetcher';
import { useAuthStore } from '@/store/auth';

import { QUERY_KEYS } from '../api/query-keys';

const BASE_URL = String(import.meta.env.VITE_SERVER_URL);

export type CreateSessionPhase = 'uploading' | 'creating' | 'redirecting';

export type CreateSessionProgress = {
  phase: CreateSessionPhase;
  uploadPercent?: number;
};

export type CreateSessionInput = {
  topic: string;
  questionTypeCounts: Array<{ type: string; count: number }>;
  file?: File;
  documentId?: string;
  webQuery?: string;
  curriculum?: string;
  grade?: string;
  classGrade?: string;
  includeImages?: boolean;
  onProgress?: (progress: CreateSessionProgress) => void;
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
  formData.set('includeImages', String(input.includeImages ?? true));
  return formData;
}

function createSessionWithUpload(
  input: CreateSessionInput,
): Promise<CreateSessionResponse> {
  const { onProgress } = input;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = toFormData(input);
    const url = `${BASE_URL}/api/sessions`;

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      onProgress?.({
        phase: 'uploading',
        uploadPercent: Math.round((event.loaded / event.total) * 100),
      });
    });

    xhr.upload.addEventListener('loadend', () => {
      onProgress?.({ phase: 'creating' });
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as CreateSessionResponse);
        } catch {
          reject(new Error('Invalid response'));
        }
        return;
      }
      try {
        const body = JSON.parse(xhr.responseText) as { error?: string };
        reject(new Error(body.error ?? 'Something went wrong'));
      } catch {
        reject(new Error('Something went wrong'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error'));
    });

    xhr.open('POST', url);
    const token = useAuthStore.getState().token;
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}

export async function createSessionService(
  input: CreateSessionInput,
): Promise<CreateSessionResponse> {
  if (input.file) {
    return createSessionWithUpload(input);
  }

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
