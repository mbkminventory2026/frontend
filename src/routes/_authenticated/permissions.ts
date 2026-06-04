import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/permissions')({
  beforeLoad: () => {
    requirePermission('PERMISSION_READ')()
  },
  component: Outlet,
})
