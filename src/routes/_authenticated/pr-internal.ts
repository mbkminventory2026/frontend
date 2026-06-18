import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/pr-internal')({
  beforeLoad: () => {
    requirePermission('PR_INTERNAL_READ')()
  },
  component: Outlet,
})
