import { createFileRoute, Outlet, redirect } from '@tanstack/vue-router'
import { decodeJwt } from '@/lib/auth'
import { requirePermission } from '@/lib/requirePermission'

function requireAdminSistemRole() {
  const token = localStorage.getItem('accessToken')
  const claims = decodeJwt(token)
  const hasAllAccess = claims?.permissions?.includes('ALL_ACCESS') ?? false

  if (claims?.role_name !== 'ADMIN_SISTEM' && !hasAllAccess) {
    throw redirect({ to: '/forbidden' })
  }
}

export const Route = createFileRoute('/_authenticated/history-log')({
  beforeLoad: () => {
    requirePermission('LOG_READ')()
    requireAdminSistemRole()
  },
  component: Outlet,
})
