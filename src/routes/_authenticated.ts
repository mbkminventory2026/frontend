import { createFileRoute, redirect } from '@tanstack/vue-router'
import Auth from '@/layouts/Auth.vue'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw redirect({ to: '/login' });
  },
  component: Auth,
})


