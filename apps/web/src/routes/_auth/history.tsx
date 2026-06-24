import { createFileRoute } from '@tanstack/react-router';

import { HistoryPage } from '@/modules/history/history-page';

export const Route = createFileRoute('/_auth/history')({
  component: HistoryPage,
  head: () => ({
    meta: [{ title: 'Riwayat - QuestGen' }],
  }),
});
