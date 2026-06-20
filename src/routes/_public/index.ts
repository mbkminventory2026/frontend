import { createFileRoute, redirect } from '@tanstack/vue-router'

export const Route = createFileRoute('/_public/')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');

    // Force login: no public landing page
    throw redirect({ to: token ? ('/dashboard' as any) : '/login' })
  },
})
