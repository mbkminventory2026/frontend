import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/po-client')({
  beforeLoad: () => {
    requirePermission('PO_CLIENT_READ')()
  },
  component: Outlet,
})
