import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/packing-list')({
  beforeLoad: () => {
    requirePermission('PACKING_LIST_READ')()
  },
  component: Outlet,
})
