import { createFileRoute, redirect } from '@tanstack/vue-router'
import LoginPage from '@/pages/login/page.vue'
import { z } from 'zod'
import { decodeJwt } from '@/lib/auth'
import { getDefaultAuthenticatedPath } from '@/lib/access'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const claims = decodeJwt(token)
    if (!claims) return

    throw redirect({
      to: getDefaultAuthenticatedPath(claims),
    })
  },
  component: LoginPage,
  staticData: {
    breadcrumb: 'Login'
  }
})
