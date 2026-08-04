import { createFileRoute } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'
import SystemBackupsPage from '@/pages/system-backups/page.vue'
import { systemBackupsSearchSchema, stripSystemBackupsDefaults } from '@/pages/system-backups/schema'

export const Route = createFileRoute('/_authenticated/system-backups/')({
  validateSearch: (search) => stripSystemBackupsDefaults(systemBackupsSearchSchema.parse(search)),
  beforeLoad: requirePermission('SYSTEM_BACKUP_READ'),
  component: SystemBackupsPage,
  staticData: { breadcrumb: 'Manajemen Backup' },
})
