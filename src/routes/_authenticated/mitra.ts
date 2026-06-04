import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/mitra')({
  beforeLoad: () => {
    requirePermission('MASTER_MITRA_READ')()
  },
  component: Outlet,
})
