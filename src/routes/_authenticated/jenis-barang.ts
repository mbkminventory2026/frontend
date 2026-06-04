import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/jenis-barang')({
  beforeLoad: () => {
    requirePermission('MASTER_JENIS_BARANG_READ')()
  },
  component: Outlet,
})
