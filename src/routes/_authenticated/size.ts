import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/size')({
  beforeLoad: () => {
    requirePermission('MASTER_SIZE_READ')()
  },
  component: Outlet,
})
