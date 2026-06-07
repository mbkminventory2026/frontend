import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/marker-plan')({
  beforeLoad: () => {
    requirePermission('MARKER_PLAN_READ')()
  },
  component: Outlet,
})
