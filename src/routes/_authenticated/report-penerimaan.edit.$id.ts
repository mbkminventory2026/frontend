import { createFileRoute } from '@tanstack/vue-router'
import ReportPenerimaanEditPage from '@/pages/reportPenerimaan/edit/page.vue'

export const Route = createFileRoute('/_authenticated/report-penerimaan/edit/$id')({
    component: ReportPenerimaanEditPage,
    staticData: {
        breadcrumb: 'Edit Report Penerimaan'
    }
})
