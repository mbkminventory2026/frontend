import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/report-penerimaan')({
  beforeLoad: () => {
    requirePermission('REPORT_READ')()
  },
  component: Outlet,
})
