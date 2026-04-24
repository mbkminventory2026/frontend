import { createFileRoute, redirect } from '@tanstack/vue-router'
import AuthenticatedLayout from '@/layouts/Root.vue'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthenticatedLayout,
})


