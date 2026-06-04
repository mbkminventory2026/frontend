import { createFileRoute } from '@tanstack/vue-router'
import PasswordResetRequestsPage from '@/pages/auth/password-reset-requests/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/password-reset-requests')({
  beforeLoad: requirePermission('PASSWORD_RESET_REQUEST_READ'),
  component: PasswordResetRequestsPage,
  staticData: {
    breadcrumb: 'Password Reset Requests',
  },
})
