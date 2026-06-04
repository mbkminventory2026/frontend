import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/po-internal')({
  beforeLoad: () => {
    requirePermission('PO_INTERNAL_READ')()
  },
  component: Outlet,
})
