import { createFileRoute } from '@tanstack/react-router';

import { SessionDetailPage } from '@/modules/session-detail/session-detail-page';

export const Route = createFileRoute('/_auth/session/$id')({
  component: SessionDetailRoute,
  head: () => ({
    meta: [{ title: 'Sesi Pembuatan - QuestGen' }],
  }),
});

function SessionDetailRoute() {
  const { id } = Route.useParams();
  return <SessionDetailPage sessionId={id} />;
}
