import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/barang')({
  beforeLoad: () => {
    requirePermission('MASTER_BARANG_READ')()
  },
  component: Outlet,
})
