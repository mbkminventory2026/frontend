import { createFileRoute } from '@tanstack/vue-router'
import LoginPage from '@/pages/login/page.vue'
import { z } from 'zod'

export const Route = createFileRoute('/_public/login')({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  component: LoginPage,
  staticData: {
    breadcrumb: 'Login'
  }
})
