import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/surat-jalan-internal')({
  beforeLoad: () => {
    requirePermission('SURAT_JALAN_INTERNAL_READ')()
  },
  component: Outlet,
})
