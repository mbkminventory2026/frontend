import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/master-plan')({
  beforeLoad: () => {
    requirePermission('MASTER_PLAN_READ')()
  },
  component: Outlet,
})
