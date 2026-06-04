import { createFileRoute } from '@tanstack/vue-router'
import ReportPenerimaanCreatePage from '@/pages/reportPenerimaan/create/page.vue'

export const Route = createFileRoute('/_authenticated/report-penerimaan/create')({
    component: ReportPenerimaanCreatePage,
    staticData: {
        breadcrumb: 'Tambah Report Penerimaan'
    }
})
