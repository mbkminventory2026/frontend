import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/warna')({
  beforeLoad: () => {
    requirePermission('MASTER_WARNA_READ')()
  },
  component: Outlet,
})
