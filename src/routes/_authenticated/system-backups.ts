import { createFileRoute, Outlet } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/system-backups')({
  beforeLoad: requirePermission('SYSTEM_BACKUP_READ'),
  component: Outlet,
})
