import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/material-list')({
  beforeLoad: () => {
    requirePermission('MATERIAL_LIST_READ')()
  },
  component: Outlet,
})
