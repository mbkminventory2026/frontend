import DashboardPage from '@/pages/dashboard/page.vue'
import { createFileRoute } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/dashboard')({
  beforeLoad: () => {
    requirePermission('DASHBOARD_READ')()
  },
  component: DashboardPage,
  staticData: { breadcrumb: 'Dashboard' }
})
