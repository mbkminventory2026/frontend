import { createFileRoute } from '@tanstack/vue-router'
import ForgotPasswordPage from '@/pages/auth/forgot-password/page.vue'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
  staticData: {
    breadcrumb: 'Forgot Password',
  },
})
