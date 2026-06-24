import type { ExportPdfInput } from '@/modules/session-detail/export-pdf-schema';
import { api } from '@/services/fetcher';

export async function exportSessionPdfService(
  sessionId: string,
  input: ExportPdfInput,
): Promise<Blob> {
  return api.post(`sessions/${sessionId}/export/pdf`, { json: input }).blob();
}
