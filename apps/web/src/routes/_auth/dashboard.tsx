import { createFileRoute } from '@tanstack/react-router';

import { DashboardPage } from '@/modules/dashboard/dashboard-page';

export const Route = createFileRoute('/_auth/dashboard')({
	component: DashboardPage,
	head: () => ({
		meta: [{ title: 'Dashboard - QuestGen' }],
	}),
});
