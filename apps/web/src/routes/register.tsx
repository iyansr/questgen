import { createFileRoute, redirect } from '@tanstack/react-router';

import { RegisterPage } from '@/modules/register/register-page';
import { useAuthStore } from '@/store/auth';

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: RegisterPage,
  head: () => ({
    meta: [{ title: 'Buat Akun - QuestGen' }],
  }),
});
