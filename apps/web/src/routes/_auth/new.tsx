import { createFileRoute } from '@tanstack/react-router';

import { NewSessionPage } from '@/modules/new-session/new-session-page';

export const Route = createFileRoute('/_auth/new')({
  component: NewSessionPage,
});
