import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/data-approve-cutting-plan')({
  beforeLoad: () => {
    requirePermission('DATA_APPROVE_CUTTING_PLAN_READ')()
  },
  component: Outlet,
})
