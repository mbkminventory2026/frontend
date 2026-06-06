import { createFileRoute } from '@tanstack/vue-router'
import ReportsPage from '@/pages/reports/page.vue'

export const Route = createFileRoute('/_authenticated/reports/')({
  component: ReportsPage,
  staticData: {
    breadcrumb: 'Laporan Produksi',
  },
})
