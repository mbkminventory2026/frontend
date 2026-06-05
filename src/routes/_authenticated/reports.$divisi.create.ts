import { createFileRoute, notFound } from '@tanstack/vue-router'
import FactoryReportCreatePage from '@/pages/reports/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'
import { VALID_DIVISIONS, type DivisionSlug } from '@/schemas/production/production'

export const Route = createFileRoute('/_authenticated/reports/$divisi/create')({
  beforeLoad: ({ params }) => {
    requirePermission('PRODUCTION_REPORT_CREATE')()
    if (!VALID_DIVISIONS.includes(params.divisi as DivisionSlug)) {
      throw notFound()
    }
  },
  component: FactoryReportCreatePage,
  staticData: {
    breadcrumb: 'Tambah Laporan Produksi',
  },
})
