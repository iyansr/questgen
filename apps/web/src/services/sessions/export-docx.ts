import type { ExportExamInput } from '@/modules/session-detail/export-exam-schema';
import { api } from '@/services/fetcher';

export async function exportSessionDocxService(
  sessionId: string,
  input: ExportExamInput,
): Promise<Blob> {
  return api.post(`sessions/${sessionId}/export/docx`, { json: input }).blob();
}
