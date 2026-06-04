import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/roles')({
  beforeLoad: () => {
    requirePermission('ROLE_READ')()
  },
  component: Outlet,
})
