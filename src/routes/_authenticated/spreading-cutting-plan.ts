import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/spreading-cutting-plan')({
  beforeLoad: () => {
    requirePermission('CUTTING_PLAN_READ')()
  },
  component: Outlet,
})
