import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/users')({
  beforeLoad: () => {
    requirePermission('USER_READ')()
  },
  component: Outlet,
})
