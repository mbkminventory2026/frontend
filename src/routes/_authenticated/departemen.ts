import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/departemen')({
  beforeLoad: () => {
    requirePermission('MASTER_DEPARTEMEN_READ')()
  },
  component: Outlet,
})
