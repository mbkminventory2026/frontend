import { createFileRoute, redirect } from '@tanstack/vue-router'
import LandingPage from '@/pages/landing/page.vue';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      throw redirect({ to:'/dashboard' as any })
    };
  },
  component: LandingPage,
})
