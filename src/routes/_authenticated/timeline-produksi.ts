import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/timeline-produksi')({
  beforeLoad: () => {
    requirePermission('TIMELINE_PRODUKSI_READ')()
  },
  component: Outlet,
})
