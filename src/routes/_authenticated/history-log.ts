import { createFileRoute, Outlet, redirect } from '@tanstack/vue-router'
import { decodeJwt } from '@/lib/auth'
import { requirePermission } from '@/lib/requirePermission'

function requireOperatorRole() {
  const token = localStorage.getItem('accessToken')
  const claims = decodeJwt(token)

  if (claims?.role_name !== 'OPERATOR') {
    throw redirect({ to: '/forbidden' })
  }
}

export const Route = createFileRoute('/_authenticated/history-log')({
  beforeLoad: () => {
    requirePermission('LOG_READ')()
    requireOperatorRole()
  },
  component: Outlet,
})
