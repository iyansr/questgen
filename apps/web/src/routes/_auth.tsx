import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { DashboardLayout } from '@/modules/dashboard/dashboard-layout';
import { useAuthStore } from '@/store/auth';

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthLayoutComponent,
});

function AuthLayoutComponent() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
