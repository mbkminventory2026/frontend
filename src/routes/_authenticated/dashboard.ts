import DashboardPage from '@/pages/dashboard/page.vue'
import { createFileRoute } from '@tanstack/vue-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
  staticData: { breadcrumb: 'Dashboard' }
})
