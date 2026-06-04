import { createFileRoute } from '@tanstack/vue-router'
import ChangePasswordPage from '@/pages/auth/change-password/page.vue'

export const Route = createFileRoute('/_authenticated/change-password')({
  component: ChangePasswordPage,
  staticData: {
    breadcrumb: 'Change Password',
  },
})
