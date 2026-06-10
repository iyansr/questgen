import { createFileRoute, redirect } from '@tanstack/react-router';

import { LoginPage } from '@/modules/login/login-page';
import { useAuthStore } from '@/store/auth';

export const Route = createFileRoute('/login')({
	beforeLoad: () => {
		const isAuthenticated = useAuthStore.getState().isAuthenticated;
		if (isAuthenticated) {
			throw redirect({ to: '/dashboard' });
		}
	},
	component: LoginPage,
	head: () => ({
		meta: [{ title: 'Masuk - QuestGen' }],
	}),
});
